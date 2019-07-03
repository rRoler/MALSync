import {entryClass} from "./../provider/Simkl/entryClass";
import Vue from 'vue';
import malkiss from './malkiss.vue';

interface detail{
  page: "detail",
  id: number,
  malid: number,
  type: "anime"|"manga",
  malObj: undefined
}

export class simklClass{
  page: any = null

  private interval;
  private malkiss;

  constructor(public url:string){
    utils.urlChangeDetect(() => {
      this.interval = utils.waitUntilTrue(function(){
        return (!$('#global_div').length || parseInt($('#global_div').css('opacity')) === 1) &&
        (!$('#tvMainTable').length || parseInt($('#tvMainTable').css('opacity')) === 1);
      }, () => {
        this.url = window.location.href;
        this.init();
      }, 1000)
    });

    api.storage.addStyle(require('./style.less').toString());
    $(document).ready(() => {
      this.init();
    });
  }

  async init(){
    con.log(this.url);

    var urlpart = utils.urlPart(this.url, 3);
    if(urlpart == 'anime' || urlpart == 'manga'){
      var malObj = new entryClass(this.url);
      await malObj.init();

      this.page = {
        page: "detail",
        id: malObj.simklId,
        malid: malObj.id,
        type: urlpart,
        malObj: malObj,
      }
      con.log('page', this.page);

      $('.SimklTVAboutBlockTitle').after('<div id="malkiss"></div>')
      this.malkiss = new Vue({
        el: "#malkiss",
        render: h => h(malkiss)
      }).$children[0];

      this.streamingUI();
      this.malToKiss();
    }
  }

  async streamingUI(){
    con.log('Streaming UI');
    $('#mal-sync-stream-div').remove();
    var malObj = this.page.malObj;

    var streamUrl = malObj.getStreamingUrl();
    if(typeof streamUrl !== 'undefined'){

      $(document).ready(async () => {
        this.malkiss.streamUrl = streamUrl;

        $('h1').first().append(`
        <div class="data title progress" id="mal-sync-stream-div" style="display: inline-block; position: relative; font-size: 20px; margin-left: -5px;">
          <a class="mal-sync-stream" title="${streamUrl.split('/')[2]}" target="_blank" style="margin: 0 0; display: inline-block;" href="${streamUrl}">
            <img src="${utils.favicon(streamUrl.split('/')[2])}">
          </a>
        </div>`);

        var resumeUrlObj = await malObj.getResumeWaching();
        var continueUrlObj = await malObj.getContinueWaching();
        con.log('Resume', resumeUrlObj, 'Continue', continueUrlObj);
        if(typeof continueUrlObj !== 'undefined' && continueUrlObj.ep === (malObj.getEpisode()+1)){
          this.malkiss.continueUrl = continueUrlObj.url;
          $('#mal-sync-stream-div').append(
            `<a class="nextStream" title="${api.storage.lang('overview_Continue_'+malObj.type)}" target="_blank" style="display: inline-block; margin: 0; width: 11px; color: #BABABA;" href="${continueUrlObj.url}">
              <img src="${api.storage.assetUrl('double-arrow-16px.png')}" width="16" height="16">
            </a>`
            );
        }else if(typeof resumeUrlObj !== 'undefined' && resumeUrlObj.ep === malObj.getEpisode()){
          this.malkiss.resumeUrl = resumeUrlObj.url;
          $('#mal-sync-stream-div').append(
            `<a class="resumeStream" title="${api.storage.lang('overview_Resume_Episode_'+malObj.type)}" target="_blank" style="display: inline-block; margin: 0; width: 11px; color: #BABABA;" href="${resumeUrlObj.url}">
              <img src="${api.storage.assetUrl('arrow-16px.png')}" width="16" height="16">
            </a>`
            );
        }

        try{
          window.dispatchEvent(new Event('resize'));
        }catch(e){
          con.info('Resize failed', e)
        }

      });
    }
  }

  malToKiss(){
    con.log('malToKiss');
    utils.getMalToKissArray(this.page!.type, this.page!.malid).then((links) => {
      this.malkiss.links = links;
    })
  }

}
