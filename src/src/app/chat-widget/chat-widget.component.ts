import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent {

  isOpen = true;
  userMessage = '';
  messages: any[] = [];
  chatOpen = false;
  isFullscreen = true;

  recognition: any;

  constructor(private http: HttpClient,private sanitizer: DomSanitizer) {

    // Welcome message
    this.messages.push({
      sender: 'bot',
      text: `Hello! 👋 Welcome to the NGI Assistant.`,
      text1: `How can NGI help you today?`,
      text2: `⚠️ Disclaimer: Some information provided by this chatbot may be sourced from the internet. While we try to keep the information accurate, NGI does not guarantee its completeness or reliability. Users are advised to verify important details through official sources and use the information at their own discretion.`
    });

    // Initialize voice recognition
     const SpeechRecognition =
    (window as any).webkitSpeechRecognition ||
    (window as any).SpeechRecognition;

  if (SpeechRecognition) {

    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-IN';

    this.recognition.onresult = (event: any) => {

      const voiceText = event.results[0][0].transcript;

      console.log("Speech Detected:", voiceText);

      // directly show in input box
      this.userMessage = voiceText;

    };

  } else {

    alert("Speech recognition not supported in this browser");

  }

  }

  

   transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  openChat() {
    this.chatOpen = true;
  }

  // 🎤 Start voice recording
startVoice() {

   if (!this.recognition) {
    alert("Voice recognition not available");
    return;
  }

  try {

    this.recognition.start();

  } catch (e) {

    console.error("Speech start error:", e);

  }

}
  // 🌍 Translate any language → English
  translateToEnglish(text: string) {

  const url =
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;

  this.http.get(url).subscribe((res: any) => {

    const translated = res[0][0][0];

    console.log("Translated:", translated);

    // show in input box instead of sending
    this.userMessage = translated;

  });

}

  // Format DuckDuckGo redirect links
  formatLink(link: string): string {

    if (!link) return '#';

    if (link.includes('duckduckgo.com/l/')) {

      try {

        const match = link.match(/uddg=([^&]+)/);

        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }

      } catch (e) {

        console.error('Error formatting link:', e);

      }

    }

    if (link.startsWith('//')) {
      return 'https:' + link;
    }

    return link;

  }

  sendMessage() {

    if (!this.userMessage.trim()) return;

    // user message
    this.messages.push({
      sender: 'user',
      text: this.userMessage
    });

    const message = this.userMessage;

    this.userMessage = '';

    this.http.post<any>('https://aichatbotbackend-yumn.onrender.com/chat', {
      message: message
    }).subscribe({

      next: (res) => {

        this.messages.push({
          sender: 'bot',
          summary: res.summary || '',
          links: res.links || [],
          videos: res.links || [],
        });

        // 🔊 speak summary
        if (res.summary) {
          // this.speak(res.summary);
        }

      },

      error: (error) => {

        console.error('API Error:', error);

        this.messages.push({
          sender: 'bot',
          text: 'Sorry, I encountered an error. Please try again.'
        });

      }

    });

  }

 formatLinkk(url: string): string {
  try {
    // Decode DuckDuckGo redirect
    if (url.includes('duckduckgo.com/l/?uddg=')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const uddg = params.get('uddg');
      if (uddg) url = decodeURIComponent(uddg);
    }

    // Extract YouTube ID
    const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;

    return url.startsWith('//') ? 'https:' + url : url;
  } catch (e) {
    console.error(e);
    return url;
  }
}

  // 🔊 Text to speech
  // speak(text: string) {

  //   const speech = new SpeechSynthesisUtterance(text);

  //   speech.lang = 'en-IN';
  //   speech.rate = 1;

  //   window.speechSynthesis.speak(speech);

  // }

}