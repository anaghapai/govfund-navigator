// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let currentLang = 'en';
let currentBiz = {};
let currentResults = null;
let currentEmailScheme = null;
window._schemes = [];

// Weekly upload cap
const WEEKLY_LIMIT = 7;
const WEEK_KEY = 'gfn_week_' + getWeekId();

function getWeekId() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '_' + Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
function getWeekUploads() { return parseInt(localStorage.getItem(WEEK_KEY) || '0'); }
function incWeekUploads() { localStorage.setItem(WEEK_KEY, getWeekUploads() + 1); }

// ════════════════════════════════════════════
// SAMPLE STORIES DATA (pre-loaded)
// ════════════════════════════════════════════
const SAMPLE_STORIES = [
  {
    name: "Meena Devi",
    location: "Barmer, Rajasthan",
    bizType: "Handicrafts",
    scheme: "PMEGP",
    amount: "₹4,80,000",
    text: "I had no idea this scheme existed. After using GovFund Navigator I got the checklist, submitted my application and got ₹4.8L within 3 months. My embroidery business now employs 6 women.",
    photo: "hero2.jpg",
    week: true
  },
  {
    name: "Ranjit Singh",
    location: "Ludhiana, Punjab",
    bizType: "Dairy",
    scheme: "NABARD Dairy Loan",
    amount: "₹2,20,000",
    text: "Bought 4 more cows and a milk cooler with the NABARD subsidy. My income doubled in 8 months. The document checklist saved me 3 trips to the bank.",
    photo: "hero3.jpg",
    week: true
  },
  {
    name: "Lakshmi SHG",
    location: "Tumkur, Karnataka",
    bizType: "Self Help Group",
    scheme: "Udyogini Scheme",
    amount: "₹1,00,000",
    text: "Our group of 12 women got the Karnataka Udyogini grant. We now run a pickle and papad unit selling to 3 districts. Total turnover ₹18L this year.",
    photo: "hero1.jpg",
    week: true
  },
  {
    name: "Arjun Textiles",
    location: "Surat, Gujarat",
    bizType: "Manufacturing",
    scheme: "TUFS Subsidy",
    amount: "₹8,50,000",
    text: "The TUFS subsidy helped us upgrade 4 looms. Production doubled and we got an export order from a Dubai buyer last quarter.",
    photo: "story4.jpg",
    week: false
  },
  {
    name: "Priya Goswami",
    location: "Guwahati, Assam",
    bizType: "Food Processing",
    scheme: "PM FME Scheme",
    amount: "₹3,60,000",
    text: "I was selling bamboo shoot pickle from home. With the PM FME subsidy I set up a proper unit with FSSAI license. Now supplying to 2 supermarket chains.",
    photo: "story5.jpg",
    week: false
  }
];

// ════════════════════════════════════════════
// TRANSLATIONS — complete coverage
// ════════════════════════════════════════════
const T = {
  en: {
    // NAV
    navFind: 'Find Schemes',
    navStories: 'Stories',
    navHistory: 'History',

    // TICKER
    ticker1: '🔍 Agent 1 — Eligibility Scoring',
    ticker2: '📋 Agent 2 — Scheme Matching',
    ticker3: '📄 Agent 3 — Document Checklist',
    ticker4: '📧 Agent 4 — Email Draft',

    // HERO
    heroBadge: '🇮🇳 For India\'s Businesses',
    heroTitle: 'Find funding<br/><em>you actually qualify for</em>',
    heroSub: 'Thousands of crores go unclaimed every year. Your business may qualify for free grants, subsidies, and low-interest loans — find out in 30 seconds.',
    heroStat1Val: '₹2,000Cr+', heroStat1Lbl: 'Available yearly',
    heroStat2Val: '500+',       heroStat2Lbl: 'Schemes',
    heroStat3Val: '30 sec',     heroStat3Lbl: 'To check eligibility',
    heroCta: 'Check My Eligibility →',

    // ANALYZE SECTION
    sectionLabel: '4-AGENT AI ANALYSIS',
    sectionTitle: 'Tell us about your business',
    sectionSub: 'Our AI reads real government scheme data and matches you in seconds.',

    // FORM LABELS & PLACEHOLDERS
    lblName: 'Business Name',       phName: 'e.g. Riya Agro Pvt Ltd',
    lblType: 'Business Type',       phType: 'Select type',
    lblState: 'State',              phState: 'Select state',
    lblRevenue: 'Annual Revenue',   phRevenue: 'Select range',
    lblAge: 'Years in Operation',   phAge: 'Select',
    lblSector: 'Sector',            phSector: 'Select sector',
    lblDesc: 'Describe your business',
    phDesc: 'What do you make or sell? Who are your customers? E.g. \'We make organic pickles and sell to local stores in Mysore.\'',
    btnText: '🚀 Analyze My Eligibility',

    // FORM SELECT OPTIONS — Business Type
    optStartup: 'Startup',
    optWomen: 'Women-led Business',
    optNGO: 'NGO',
    optRural: 'Rural Enterprise',
    optMSME: 'MSME',
    optSHG: 'Self Help Group',

    // FORM SELECT OPTIONS — Revenue
    optRev1: 'Under ₹5 Lakh',
    optRev2: '₹5L – ₹10 Lakh',
    optRev3: '₹10L – ₹20 Lakh',
    optRev4: '₹20 Lakh+',

    // FORM SELECT OPTIONS — Age
    optAge1: 'Less than 1 year',
    optAge2: '1–3 years',
    optAge3: '3–5 years',
    optAge4: 'More than 5 years',

    // FORM SELECT OPTIONS — Sector
    optAgriculture: 'Agriculture',
    optTech: 'Technology',
    optMfg: 'Manufacturing',
    optTextile: 'Textile',
    optHealth: 'Healthcare',
    optEdu: 'Education',
    optFood: 'Food Processing',
    optHandicraft: 'Handicrafts',
    optEnergy: 'Renewable Energy',
    optOther: 'Other',

    // LOADING
    loadingTitle: 'Checking your eligibility',
    loadingStep1: 'Reading your business profile...',
    loadingStep2: 'Checking eligibility against scheme database...',
    loadingStep3: 'Matching real government schemes...',
    loadingStep4: 'Building document checklist...',
    loadingSource: 'Matching against <strong>12 verified government schemes</strong> from MSME, NABARD, Ministry of Finance and Ministry of Textiles databases.',

    // RESULTS
    scoreLabel: 'Eligibility Score',
    schemesHdr: 'Your Matching Schemes',
    copyChecklist: '📋 Copy Checklist',
    copiedChecklist: '✓ Copied!',
    draftEmail: '📧 Draft Application Email',
    officialSite: '🔗 Official Website',
    docsRequired: '📄 Documents Required',
    deadlinePrefix: 'Deadline:',
    applyNow: 'Apply Now →',
    ongoingBadge: '🟢 Ongoing',
    resetBtn: '← Analyze Another Business',

    // HOME STORIES PREVIEW
    realStoriesLabel: 'REAL STORIES',
    realStoriesTitle: 'People like you are getting funded',
    btnTellStory: 'Tell My Story',
    btnSeeStories: 'See All Stories',

    // STORIES PAGE
    communityLabel: 'COMMUNITY VOICES',
    storiesHeroTitle: 'Hear Our <em>Stories</em>',
    storiesHeroSub: 'Real businesses from rural India sharing how they found and claimed government funding. <strong>7 new stories added every week.</strong>',
    thisWeekBadge: "This Week's Stories",

    // UPLOAD STORY FORM
    shareLabel: 'SHARE YOUR JOURNEY',
    shareTitle: 'Upload<br/><em>Your Story</em>',
    shareSub: 'Inspire other business owners. Tell them what scheme you found, how much you got, and what changed for your family.',
    weeklyWindow: '📅 Weekly Upload Window',
    storyLblName: 'Your Name',         storyPhName: 'e.g. Meena Devi',
    storyLblLoc: 'District & State',   storyPhLoc: 'e.g. Tumkur, Karnataka',
    storyLblBiz: 'Business Type',
    storyLblScheme: 'Scheme You Got',  storyPhScheme: 'e.g. PMEGP, Mudra Loan',
    storyLblAmount: 'Amount Received (₹)', storyPhAmount: 'e.g. 4,80,000',
    storyLblText: 'Your Story',
    storyPhText: 'Tell others: how did you find out, how did you apply, what changed after you got the funding?',
    storyLblPhoto: 'Photo (optional)',
    photoUploadText: 'Click to upload a photo of you or your business',
    photoUploadSub: 'JPG or PNG · Max 5MB',
    submitStoryBtn: 'Submit My Story',
    submittingBtn: 'Submitting...',
    submittedBtn: '✓ Story Submitted!',

    // Story biztype options
    storyOptAgri: 'Agriculture',
    storyOptFood: 'Food Processing',
    storyOptTextile: 'Textile / Handicrafts',
    storyOptDairy: 'Dairy / Livestock',
    storyOptMfg: 'Small Manufacturing',
    storyOptSHG: 'Self Help Group',
    storyOptOther: 'Other',

    // HISTORY PAGE
    historyLabel: 'YOUR SEARCHES',
    historyTitle: 'Analysis <em>History</em>',
    historySub: 'All past eligibility checks saved here.',
    historyLoading: 'Loading...',
    historyEmpty: 'No analyses yet. Go find your schemes!',
    historyError: 'Could not load history.',

    // EMAIL MODAL
    emailModalTitle: '📧 Application Email Draft',
    emailLoadingMsg: 'Agent 4 drafting your email...',
    emailSubjectLbl: 'Subject',
    emailBodyLbl: 'Body',
    emailCopyBtn: '📋 Copy',
    emailCopiedBtn: '✓ Copied!',
    emailSendBtn: '📨 Open in Mail App',
    emailNote: 'Opens your default mail app with this email pre-filled. You review and send.',

    // ALERTS
    alertFillFields: 'Please fill in all required fields.',
    alertWeekFull: `This week's ${WEEKLY_LIMIT} story slots are full. Come back next week!`,
    alertStoryFields: 'Please fill in Name, Location, Scheme, and Your Story at minimum.',
  },

  hi: {
    navFind: 'योजनाएं खोजें',
    navStories: 'कहानियां',
    navHistory: 'इतिहास',

    ticker1: '🔍 एजेंट 1 — पात्रता स्कोरिंग',
    ticker2: '📋 एजेंट 2 — योजना मिलान',
    ticker3: '📄 एजेंट 3 — दस्तावेज़ सूची',
    ticker4: '📧 एजेंट 4 — ईमेल ड्राफ्ट',

    heroBadge: '🇮🇳 भारत के व्यवसायों के लिए',
    heroTitle: 'वो फंडिंग पाएं<br/><em>जिसके लिए आप वास्तव में पात्र हैं</em>',
    heroSub: 'हर साल हजारों करोड़ का फंड अनक्लेम्ड रहता है। आपका व्यवसाय अनुदान और सब्सिडी के लिए पात्र हो सकता है।',
    heroStat1Val: '₹2,000 करोड़+', heroStat1Lbl: 'हर साल उपलब्ध',
    heroStat2Val: '500+',           heroStat2Lbl: 'योजनाएं',
    heroStat3Val: '30 सेकंड',       heroStat3Lbl: 'पात्रता जांचने में',
    heroCta: 'मेरी पात्रता जांचें →',

    sectionLabel: '4-एजेंट AI विश्लेषण',
    sectionTitle: 'अपने व्यवसाय के बारे में बताएं',
    sectionSub: 'हमारा AI असली सरकारी योजना डेटा पढ़कर आपको तुरंत मैच करता है।',

    lblName: 'व्यवसाय का नाम',       phName: 'जैसे: रिया एग्रो प्रा. लि.',
    lblType: 'व्यवसाय प्रकार',       phType: 'प्रकार चुनें',
    lblState: 'राज्य',               phState: 'राज्य चुनें',
    lblRevenue: 'वार्षिक राजस्व',    phRevenue: 'सीमा चुनें',
    lblAge: 'संचालन के वर्ष',        phAge: 'चुनें',
    lblSector: 'क्षेत्र',            phSector: 'क्षेत्र चुनें',
    lblDesc: 'व्यवसाय विवरण',
    phDesc: 'आप क्या बनाते या बेचते हैं? आपके ग्राहक कौन हैं?',
    btnText: '🚀 पात्रता जाँचें',

    optStartup: 'स्टार्टअप',
    optWomen: 'महिला-नेतृत्व व्यवसाय',
    optNGO: 'एनजीओ',
    optRural: 'ग्रामीण उद्यम',
    optMSME: 'एमएसएमई',
    optSHG: 'स्वयं सहायता समूह',

    optRev1: '₹5 लाख से कम',
    optRev2: '₹5L – ₹10 लाख',
    optRev3: '₹10L – ₹20 लाख',
    optRev4: '₹20 लाख+',

    optAge1: '1 साल से कम',
    optAge2: '1–3 साल',
    optAge3: '3–5 साल',
    optAge4: '5 साल से अधिक',

    optAgriculture: 'कृषि',
    optTech: 'प्रौद्योगिकी',
    optMfg: 'विनिर्माण',
    optTextile: 'वस्त्र',
    optHealth: 'स्वास्थ्य सेवा',
    optEdu: 'शिक्षा',
    optFood: 'खाद्य प्रसंस्करण',
    optHandicraft: 'हस्तशिल्प',
    optEnergy: 'नवीकरणीय ऊर्जा',
    optOther: 'अन्य',

    loadingTitle: 'आपकी पात्रता जांची जा रही है',
    loadingStep1: 'आपकी व्यवसाय प्रोफ़ाइल पढ़ी जा रही है...',
    loadingStep2: 'योजना डेटाबेस से पात्रता जांची जा रही है...',
    loadingStep3: 'असली सरकारी योजनाएं मिलाई जा रही हैं...',
    loadingStep4: 'दस्तावेज़ सूची बनाई जा रही है...',
    loadingSource: 'MSME, NABARD, वित्त मंत्रालय और वस्त्र मंत्रालय के <strong>12 सत्यापित सरकारी योजनाओं</strong> से मिलान।',

    scoreLabel: 'पात्रता स्कोर',
    schemesHdr: 'आपकी मिलान योजनाएं',
    copyChecklist: '📋 सूची कॉपी करें',
    copiedChecklist: '✓ कॉपी हो गया!',
    draftEmail: '📧 आवेदन ईमेल बनाएं',
    officialSite: '🔗 आधिकारिक वेबसाइट',
    docsRequired: '📄 आवश्यक दस्तावेज़',
    deadlinePrefix: 'अंतिम तिथि:',
    applyNow: 'अभी आवेदन करें →',
    ongoingBadge: '🟢 जारी है',
    resetBtn: '← दूसरा व्यवसाय जांचें',

    realStoriesLabel: 'असली कहानियां',
    realStoriesTitle: 'आप जैसे लोग फंडिंग पा रहे हैं',
    btnTellStory: 'मेरी कहानी बताएं',
    btnSeeStories: 'सभी कहानियां देखें',

    communityLabel: 'समुदाय की आवाजें',
    storiesHeroTitle: 'हमारी <em>कहानियां</em> सुनें',
    storiesHeroSub: 'ग्रामीण भारत के असली व्यवसाय साझा कर रहे हैं कि उन्होंने सरकारी फंडिंग कैसे पाई। <strong>हर हफ्ते 7 नई कहानियां।</strong>',
    thisWeekBadge: 'इस हफ्ते की कहानियां',

    shareLabel: 'अपनी यात्रा साझा करें',
    shareTitle: 'अपनी<br/><em>कहानी अपलोड करें</em>',
    shareSub: 'दूसरे व्यवसाय मालिकों को प्रेरित करें। बताएं कि आपने कौन सी योजना पाई और क्या बदला।',
    weeklyWindow: '📅 साप्ताहिक अपलोड विंडो',
    storyLblName: 'आपका नाम',          storyPhName: 'जैसे: मीना देवी',
    storyLblLoc: 'जिला और राज्य',      storyPhLoc: 'जैसे: तुमकुर, कर्नाटक',
    storyLblBiz: 'व्यवसाय प्रकार',
    storyLblScheme: 'मिली योजना',       storyPhScheme: 'जैसे: PMEGP, मुद्रा लोन',
    storyLblAmount: 'प्राप्त राशि (₹)', storyPhAmount: 'जैसे: 4,80,000',
    storyLblText: 'आपकी कहानी',
    storyPhText: 'दूसरों को बताएं: कैसे पता चला, कैसे आवेदन किया, फंडिंग के बाद क्या बदला?',
    storyLblPhoto: 'फोटो (वैकल्पिक)',
    photoUploadText: 'आप या अपने व्यवसाय की फोटो अपलोड करें',
    photoUploadSub: 'JPG या PNG · अधिकतम 5MB',
    submitStoryBtn: 'मेरी कहानी सबमिट करें',
    submittingBtn: 'सबमिट हो रहा है...',
    submittedBtn: '✓ कहानी सबमिट हो गई!',

    storyOptAgri: 'कृषि',
    storyOptFood: 'खाद्य प्रसंस्करण',
    storyOptTextile: 'वस्त्र / हस्तशिल्प',
    storyOptDairy: 'डेयरी / पशुधन',
    storyOptMfg: 'छोटा विनिर्माण',
    storyOptSHG: 'स्वयं सहायता समूह',
    storyOptOther: 'अन्य',

    historyLabel: 'आपकी खोजें',
    historyTitle: 'विश्लेषण <em>इतिहास</em>',
    historySub: 'सभी पुरानी पात्रता जांचें यहां सेव हैं।',
    historyLoading: 'लोड हो रहा है...',
    historyEmpty: 'अभी तक कोई विश्लेषण नहीं। अपनी योजनाएं खोजें!',
    historyError: 'इतिहास लोड नहीं हो सका।',

    emailModalTitle: '📧 आवेदन ईमेल ड्राफ्ट',
    emailLoadingMsg: 'एजेंट 4 आपका ईमेल बना रहा है...',
    emailSubjectLbl: 'विषय',
    emailBodyLbl: 'मुख्य भाग',
    emailCopyBtn: '📋 कॉपी करें',
    emailCopiedBtn: '✓ कॉपी हो गया!',
    emailSendBtn: '📨 मेल ऐप में खोलें',
    emailNote: 'यह ईमेल आपके डिफ़ॉल्ट मेल ऐप में पहले से भरा खुलेगा। आप देखकर भेजें।',

    alertFillFields: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
    alertWeekFull: `इस हफ्ते के ${WEEKLY_LIMIT} स्लॉट भर गए हैं। अगले हफ्ते आएं!`,
    alertStoryFields: 'कृपया कम से कम नाम, स्थान, योजना और कहानी भरें।',
  },

  kn: {
    navFind: 'ಯೋಜನೆಗಳು',
    navStories: 'ಕಥೆಗಳು',
    navHistory: 'ಇತಿಹಾಸ',

    ticker1: '🔍 ಏಜೆಂಟ್ 1 — ಅರ್ಹತೆ ಸ್ಕೋರಿಂಗ್',
    ticker2: '📋 ಏಜೆಂಟ್ 2 — ಯೋಜನೆ ಹೊಂದಾಣಿಕೆ',
    ticker3: '📄 ಏಜೆಂಟ್ 3 — ದಾಖಲೆ ಪಟ್ಟಿ',
    ticker4: '📧 ಏಜೆಂಟ್ 4 — ಇಮೇಲ್ ಡ್ರಾಫ್ಟ್',

    heroBadge: '🇮🇳 ಭಾರತದ ವ್ಯವಹಾರಗಳಿಗಾಗಿ',
    heroTitle: 'ನಿಮಗೆ ಅರ್ಹವಾದ<br/><em>ಧನಸಹಾಯ ಹುಡುಕಿ</em>',
    heroSub: 'ಪ್ರತಿ ವರ್ಷ ಸಾವಿರಾರು ಕೋಟಿ ರೂಪಾಯಿ ಕ್ಲೈಮ್ ಆಗದೇ ಉಳಿಯುತ್ತದೆ. ನಿಮ್ಮ ವ್ಯವಹಾರ ಅನುದಾನ ಮತ್ತು ಸಬ್ಸಿಡಿಗೆ ಅರ್ಹವಾಗಿರಬಹುದು.',
    heroStat1Val: '₹2,000 ಕೋಟಿ+', heroStat1Lbl: 'ಪ್ರತಿ ವರ್ಷ ಲಭ್ಯ',
    heroStat2Val: '500+',            heroStat2Lbl: 'ಯೋಜನೆಗಳು',
    heroStat3Val: '30 ಸೆಕೆಂಡ್',     heroStat3Lbl: 'ಅರ್ಹತೆ ತಪಾಸಿಸಲು',
    heroCta: 'ನನ್ನ ಅರ್ಹತೆ ತಪಾಸಿಸಿ →',

    sectionLabel: '4-ಏಜೆಂಟ್ AI ವಿಶ್ಲೇಷಣೆ',
    sectionTitle: 'ನಿಮ್ಮ ವ್ಯವಹಾರದ ಬಗ್ಗೆ ಹೇಳಿ',
    sectionSub: 'ನಮ್ಮ AI ನಿಜವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆ ಡೇಟಾ ಓದಿ ನಿಮಗೆ ತಕ್ಷಣ ಹೊಂದಿಸುತ್ತದೆ.',

    lblName: 'ವ್ಯವಹಾರದ ಹೆಸರು',      phName: 'ಉದಾ: ರಿಯಾ ಅಗ್ರೋ ಪ್ರೈ. ಲಿ.',
    lblType: 'ವ್ಯವಹಾರ ಪ್ರಕಾರ',       phType: 'ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ',
    lblState: 'ರಾಜ್ಯ',               phState: 'ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ',
    lblRevenue: 'ವಾರ್ಷಿಕ ಆದಾಯ',      phRevenue: 'ವ್ಯಾಪ್ತಿ ಆಯ್ಕೆಮಾಡಿ',
    lblAge: 'ಕಾರ್ಯಾಚರಣೆ ವರ್ಷಗಳು',    phAge: 'ಆಯ್ಕೆಮಾಡಿ',
    lblSector: 'ಕ್ಷೇತ್ರ',             phSector: 'ಕ್ಷೇತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    lblDesc: 'ವ್ಯವಹಾರ ವಿವರಣೆ',
    phDesc: 'ನೀವು ಏನು ತಯಾರಿಸುತ್ತೀರಿ ಅಥವಾ ಮಾರುತ್ತೀರಿ? ನಿಮ್ಮ ಗ್ರಾಹಕರು ಯಾರು?',
    btnText: '🚀 ಅರ್ಹತೆ ತಪಾಸಿಸಿ',

    optStartup: 'ಸ್ಟಾರ್ಟಪ್',
    optWomen: 'ಮಹಿಳಾ ನೇತೃತ್ವದ ವ್ಯವಹಾರ',
    optNGO: 'ಎನ್‌ಜಿಒ',
    optRural: 'ಗ್ರಾಮೀಣ ಉದ್ಯಮ',
    optMSME: 'ಎಂಎಸ್‌ಎಂಇ',
    optSHG: 'ಸ್ವಸಹಾಯ ಗುಂಪು',

    optRev1: '₹5 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ',
    optRev2: '₹5L – ₹10 ಲಕ್ಷ',
    optRev3: '₹10L – ₹20 ಲಕ್ಷ',
    optRev4: '₹20 ಲಕ್ಷ+',

    optAge1: '1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ',
    optAge2: '1–3 ವರ್ಷ',
    optAge3: '3–5 ವರ್ಷ',
    optAge4: '5 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು',

    optAgriculture: 'ಕೃಷಿ',
    optTech: 'ತಂತ್ರಜ್ಞಾನ',
    optMfg: 'ಉತ್ಪಾದನೆ',
    optTextile: 'ಜವಳಿ',
    optHealth: 'ಆರೋಗ್ಯ ಸೇವೆ',
    optEdu: 'ಶಿಕ್ಷಣ',
    optFood: 'ಆಹಾರ ಸಂಸ್ಕರಣೆ',
    optHandicraft: 'ಕರಕುಶಲ',
    optEnergy: 'ನವೀಕರಣೀಯ ಇಂಧನ',
    optOther: 'ಇತರೆ',

    loadingTitle: 'ನಿಮ್ಮ ಅರ್ಹತೆ ತಪಾಸಿಸಲಾಗುತ್ತಿದೆ',
    loadingStep1: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ಪ್ರೊಫೈಲ್ ಓದಲಾಗುತ್ತಿದೆ...',
    loadingStep2: 'ಯೋಜನೆ ಡೇಟಾಬೇಸ್ ವಿರುದ್ಧ ಅರ್ಹತೆ ತಪಾಸಿಸಲಾಗುತ್ತಿದೆ...',
    loadingStep3: 'ನಿಜವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಹೊಂದಿಸಲಾಗುತ್ತಿದೆ...',
    loadingStep4: 'ದಾಖಲೆ ಪಟ್ಟಿ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...',
    loadingSource: 'MSME, NABARD, ಹಣಕಾಸು ಸಚಿವಾಲಯ ಮತ್ತು ಜವಳಿ ಸಚಿವಾಲಯದ <strong>12 ಪರಿಶೀಲಿತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ</strong> ವಿರುದ್ಧ ಹೊಂದಿಸಲಾಗುತ್ತಿದೆ.',

    scoreLabel: 'ಅರ್ಹತೆ ಸ್ಕೋರ್',
    schemesHdr: 'ನಿಮ್ಮ ಹೊಂದಾಣಿಕೆಯ ಯೋಜನೆಗಳು',
    copyChecklist: '📋 ಪಟ್ಟಿ ನಕಲಿಸಿ',
    copiedChecklist: '✓ ನಕಲಿಸಲಾಗಿದೆ!',
    draftEmail: '📧 ಅರ್ಜಿ ಇಮೇಲ್ ಬರೆಯಿರಿ',
    officialSite: '🔗 ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್',
    docsRequired: '📄 ಅಗತ್ಯ ದಾಖಲೆಗಳು',
    deadlinePrefix: 'ಕೊನೆಯ ದಿನಾಂಕ:',
    applyNow: 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ →',
    ongoingBadge: '🟢 ಮುಂದುವರಿಯುತ್ತಿದೆ',
    resetBtn: '← ಮತ್ತೊಂದು ವ್ಯವಹಾರ ತಪಾಸಿಸಿ',

    realStoriesLabel: 'ನಿಜವಾದ ಕಥೆಗಳು',
    realStoriesTitle: 'ನಿಮ್ಮಂತಹ ಜನರು ಫಂಡಿಂಗ್ ಪಡೆಯುತ್ತಿದ್ದಾರೆ',
    btnTellStory: 'ನನ್ನ ಕಥೆ ಹೇಳಿ',
    btnSeeStories: 'ಎಲ್ಲ ಕಥೆಗಳು ನೋಡಿ',

    communityLabel: 'ಸಮುದಾಯದ ಧ್ವನಿಗಳು',
    storiesHeroTitle: 'ನಮ್ಮ <em>ಕಥೆಗಳು</em> ಕೇಳಿ',
    storiesHeroSub: 'ಗ್ರಾಮೀಣ ಭಾರತದ ನಿಜವಾದ ವ್ಯವಹಾರಗಳು ಸರ್ಕಾರಿ ಫಂಡಿಂಗ್ ಹೇಗೆ ಪಡೆದರು ಎಂದು ಹಂಚಿಕೊಳ್ಳುತ್ತಿವೆ. <strong>ಪ್ರತಿ ವಾರ 7 ಹೊಸ ಕಥೆಗಳು.</strong>',
    thisWeekBadge: 'ಈ ವಾರದ ಕಥೆಗಳು',

    shareLabel: 'ನಿಮ್ಮ ಪ್ರಯಾಣ ಹಂಚಿಕೊಳ್ಳಿ',
    shareTitle: 'ನಿಮ್ಮ<br/><em>ಕಥೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ</em>',
    shareSub: 'ಇತರ ವ್ಯವಹಾರ ಮಾಲೀಕರನ್ನು ಪ್ರೇರೇಪಿಸಿ. ನೀವು ಯಾವ ಯೋಜನೆ ಪಡೆದಿರಿ ಮತ್ತು ಏನು ಬದಲಾಯಿತು ಎಂದು ಹೇಳಿ.',
    weeklyWindow: '📅 ಸಾಪ್ತಾಹಿಕ ಅಪ್‌ಲೋಡ್ ವಿಂಡೋ',
    storyLblName: 'ನಿಮ್ಮ ಹೆಸರು',         storyPhName: 'ಉದಾ: ಮೀನಾ ದೇವಿ',
    storyLblLoc: 'ಜಿಲ್ಲೆ ಮತ್ತು ರಾಜ್ಯ',   storyPhLoc: 'ಉದಾ: ತುಮಕೂರು, ಕರ್ನಾಟಕ',
    storyLblBiz: 'ವ್ಯವಹಾರ ಪ್ರಕಾರ',
    storyLblScheme: 'ಪಡೆದ ಯೋಜನೆ',         storyPhScheme: 'ಉದಾ: PMEGP, ಮುದ್ರಾ ಲೋನ್',
    storyLblAmount: 'ಸ್ವೀಕರಿಸಿದ ಮೊತ್ತ (₹)', storyPhAmount: 'ಉದಾ: 4,80,000',
    storyLblText: 'ನಿಮ್ಮ ಕಥೆ',
    storyPhText: 'ಇತರರಿಗೆ ಹೇಳಿ: ಹೇಗೆ ತಿಳಿಯಿತು, ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದಿರಿ, ಫಂಡಿಂಗ್ ನಂತರ ಏನು ಬದಲಾಯಿತು?',
    storyLblPhoto: 'ಫೋಟೋ (ಐಚ್ಛಿಕ)',
    photoUploadText: 'ನಿಮ್ಮ ಅಥವಾ ನಿಮ್ಮ ವ್ಯವಹಾರದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    photoUploadSub: 'JPG ಅಥವಾ PNG · ಗರಿಷ್ಠ 5MB',
    submitStoryBtn: 'ನನ್ನ ಕಥೆ ಸಲ್ಲಿಸಿ',
    submittingBtn: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
    submittedBtn: '✓ ಕಥೆ ಸಲ್ಲಿಸಲಾಗಿದೆ!',

    storyOptAgri: 'ಕೃಷಿ',
    storyOptFood: 'ಆಹಾರ ಸಂಸ್ಕರಣೆ',
    storyOptTextile: 'ಜವಳಿ / ಕರಕುಶಲ',
    storyOptDairy: 'ಡೈರಿ / ಪಶುಸಂಗೋಪನೆ',
    storyOptMfg: 'ಸಣ್ಣ ಉತ್ಪಾದನೆ',
    storyOptSHG: 'ಸ್ವಸಹಾಯ ಗುಂಪು',
    storyOptOther: 'ಇತರೆ',

    historyLabel: 'ನಿಮ್ಮ ಹುಡುಕಾಟಗಳು',
    historyTitle: 'ವಿಶ್ಲೇಷಣೆ <em>ಇತಿಹಾಸ</em>',
    historySub: 'ಎಲ್ಲಾ ಹಿಂದಿನ ಅರ್ಹತೆ ತಪಾಸಣೆಗಳು ಇಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    historyLoading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    historyEmpty: 'ಇನ್ನೂ ಯಾವುದೇ ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲ. ನಿಮ್ಮ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ!',
    historyError: 'ಇತಿಹಾಸ ಲೋಡ್ ಆಗಲಿಲ್ಲ.',

    emailModalTitle: '📧 ಅರ್ಜಿ ಇಮೇಲ್ ಡ್ರಾಫ್ಟ್',
    emailLoadingMsg: 'ಏಜೆಂಟ್ 4 ನಿಮ್ಮ ಇಮೇಲ್ ಬರೆಯುತ್ತಿದೆ...',
    emailSubjectLbl: 'ವಿಷಯ',
    emailBodyLbl: 'ಮುಖ್ಯ ಭಾಗ',
    emailCopyBtn: '📋 ನಕಲಿಸಿ',
    emailCopiedBtn: '✓ ನಕಲಿಸಲಾಗಿದೆ!',
    emailSendBtn: '📨 ಮೇಲ್ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
    emailNote: 'ಈ ಇಮೇಲ್ ಮೊದಲೇ ತುಂಬಿಸಿ ನಿಮ್ಮ ಡಿಫಾಲ್ಟ್ ಮೇಲ್ ಅಪ್ ತೆರೆಯುತ್ತದೆ. ನೀವು ಪರಿಶೀಲಿಸಿ ಕಳಿಸಿ.',

    alertFillFields: 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳನ್ನು ತುಂಬಿಸಿ.',
    alertWeekFull: `ಈ ವಾರದ ${WEEKLY_LIMIT} ಸ್ಲಾಟ್‌ಗಳು ತುಂಬಿವೆ. ಮುಂದಿನ ವಾರ ಬನ್ನಿ!`,
    alertStoryFields: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಹೆಸರು, ಸ್ಥಳ, ಯೋಜನೆ ಮತ್ತು ಕಥೆ ತುಂಬಿಸಿ.',
  }
};

// ════════════════════════════════════════════
// SET LANGUAGE — covers every element
// ════════════════════════════════════════════
function setLang(lang) {
  currentLang = lang;
  ['en','hi','kn'].forEach(l => {
    document.getElementById('lang-' + l).classList.toggle('active', l === lang);
  });
  const t = T[lang];

  // NAV
  document.getElementById('nav-home').textContent    = t.navFind;
  document.getElementById('nav-stories').textContent = t.navStories;
  document.getElementById('nav-history').textContent = t.navHistory;

  // TICKER
  const tickerItems = document.querySelectorAll('.ticker-item');
  if (tickerItems[0]) tickerItems[0].textContent = t.ticker1;
  if (tickerItems[1]) tickerItems[1].textContent = t.ticker2;
  if (tickerItems[2]) tickerItems[2].textContent = t.ticker3;
  if (tickerItems[3]) tickerItems[3].textContent = t.ticker4;

  // HERO
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) heroBadge.textContent = t.heroBadge;
  document.getElementById('hero-title').innerHTML = t.heroTitle;
  document.getElementById('hero-sub').textContent  = t.heroSub;

  const statItems = document.querySelectorAll('.stat-item');
  if (statItems[0]) { statItems[0].querySelector('strong').textContent = t.heroStat1Val; statItems[0].querySelector('span').textContent = t.heroStat1Lbl; }
  if (statItems[1]) { statItems[1].querySelector('strong').textContent = t.heroStat2Val; statItems[1].querySelector('span').textContent = t.heroStat2Lbl; }
  if (statItems[2]) { statItems[2].querySelector('strong').textContent = t.heroStat3Val; statItems[2].querySelector('span').textContent = t.heroStat3Lbl; }

  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) heroCta.textContent = t.heroCta;

  // ANALYZE SECTION
  const sectionLabels = document.querySelectorAll('#analyze-section .section-label');
  if (sectionLabels[0]) sectionLabels[0].textContent = t.sectionLabel;
  const sectionTitles = document.querySelectorAll('#analyze-section .section-title');
  if (sectionTitles[0]) sectionTitles[0].textContent = t.sectionTitle;
  const sectionSubs = document.querySelectorAll('#analyze-section .section-sub');
  if (sectionSubs[0]) sectionSubs[0].textContent = t.sectionSub;

  // FORM LABELS & PLACEHOLDERS
  document.getElementById('lbl-name').textContent    = t.lblName;
  document.getElementById('lbl-type').textContent    = t.lblType;
  document.getElementById('lbl-state').textContent   = t.lblState;
  document.getElementById('lbl-revenue').textContent = t.lblRevenue;
  document.getElementById('lbl-age').textContent     = t.lblAge;
  document.getElementById('lbl-sector').textContent  = t.lblSector;
  document.getElementById('lbl-desc').textContent    = t.lblDesc;
  document.getElementById('biz-name').placeholder    = t.phName;
  document.getElementById('biz-desc').placeholder    = t.phDesc;
  document.getElementById('btn-text').textContent    = t.btnText;

  // FORM SELECT — Business Type
  const bizType = document.getElementById('biz-type');
  bizType.options[0].text = t.phType;
  bizType.options[1].text = t.optStartup;
  bizType.options[2].text = t.optWomen;
  bizType.options[3].text = t.optNGO;
  bizType.options[4].text = t.optRural;
  bizType.options[5].text = t.optMSME;
  bizType.options[6].text = t.optSHG;

  // FORM SELECT — State (keep state names in English — they're proper nouns)
  document.getElementById('biz-state').options[0].text = t.phState;

  // FORM SELECT — Revenue
  const rev = document.getElementById('biz-revenue');
  rev.options[0].text = t.phRevenue;
  rev.options[1].text = t.optRev1;
  rev.options[2].text = t.optRev2;
  rev.options[3].text = t.optRev3;
  rev.options[4].text = t.optRev4;

  // FORM SELECT — Age
  const age = document.getElementById('biz-age');
  age.options[0].text = t.phAge;
  age.options[1].text = t.optAge1;
  age.options[2].text = t.optAge2;
  age.options[3].text = t.optAge3;
  age.options[4].text = t.optAge4;

  // FORM SELECT — Sector
  const sec = document.getElementById('biz-sector');
  sec.options[0].text  = t.phSector;
  sec.options[1].text  = t.optAgriculture;
  sec.options[2].text  = t.optTech;
  sec.options[3].text  = t.optMfg;
  sec.options[4].text  = t.optTextile;
  sec.options[5].text  = t.optHealth;
  sec.options[6].text  = t.optEdu;
  sec.options[7].text  = t.optFood;
  sec.options[8].text  = t.optHandicraft;
  sec.options[9].text  = t.optEnergy;
  sec.options[10].text = t.optOther;

  // LOADING CARD
  const loadingTitle = document.querySelector('.loading-title');
  if (loadingTitle) loadingTitle.textContent = t.loadingTitle;
  const loadingSource = document.querySelector('.loading-source-note');
  if (loadingSource) loadingSource.innerHTML = t.loadingSource;

  // RESULTS — score label
  const scoreLabel = document.querySelector('.score-label');
  if (scoreLabel) scoreLabel.textContent = t.scoreLabel;

  // RESULTS — schemes header
  const schemesHdr = document.querySelector('.schemes-hdr h3');
  if (schemesHdr) schemesHdr.textContent = t.schemesHdr;

  // RESET BUTTON
  const resetBtn = document.querySelector('.reset-btn');
  if (resetBtn) resetBtn.textContent = t.resetBtn;

  // HOME STORIES PREVIEW SECTION
  const previewSection = document.querySelector('.stories-preview-section');
  if (previewSection) {
    const lbl = previewSection.querySelector('.section-label');
    if (lbl) lbl.textContent = t.realStoriesLabel;
    const ttl = previewSection.querySelector('.section-title');
    if (ttl) ttl.textContent = t.realStoriesTitle;
    const tellBtn = previewSection.querySelector('.btn-tell-story');
    if (tellBtn) tellBtn.textContent = t.btnTellStory;
    const seeBtn = previewSection.querySelector('.btn-see-stories');
    if (seeBtn) seeBtn.textContent = t.btnSeeStories;
  }

  // STORIES PAGE — hero
  const storiesHero = document.querySelector('.stories-hero .sh-text');
  if (storiesHero) {
    const lbl = storiesHero.querySelector('.section-label');
    if (lbl) lbl.textContent = t.communityLabel;
    const h1 = storiesHero.querySelector('h1');
    if (h1) h1.innerHTML = t.storiesHeroTitle;
    const p = storiesHero.querySelector('p');
    if (p) p.innerHTML = t.storiesHeroSub;
  }

  // STORIES PAGE — week badge
  const weekBadge = document.querySelector('.stories-week-badge');
  if (weekBadge) weekBadge.textContent = t.thisWeekBadge;

  // UPLOAD STORY FORM
  const uploadLeft = document.querySelector('.upload-left');
  if (uploadLeft) {
    const lbl = uploadLeft.querySelector('.section-label');
    if (lbl) lbl.textContent = t.shareLabel;
    const h2 = uploadLeft.querySelector('h2');
    if (h2) h2.innerHTML = t.shareTitle;
    const p = uploadLeft.querySelector('p');
    if (p) p.textContent = t.shareSub;
    const weekStrong = uploadLeft.querySelector('.upload-week-info strong');
    if (weekStrong) weekStrong.textContent = t.weeklyWindow;
  }

  // UPLOAD FORM FIELDS
  const uploadForm = document.querySelector('.upload-form-card');
  if (uploadForm) {
    const labels = uploadForm.querySelectorAll('.field label');
    const fields = ['storyLblName','storyLblLoc','storyLblBiz','storyLblScheme','storyLblAmount','storyLblText','storyLblPhoto'];
    const keys   = [t.storyLblName, t.storyLblLoc, t.storyLblBiz, t.storyLblScheme, t.storyLblAmount, t.storyLblText, t.storyLblPhoto];
    labels.forEach((lbl, i) => { if (keys[i]) lbl.textContent = keys[i]; });

    document.getElementById('story-name').placeholder   = t.storyPhName;
    document.getElementById('story-location').placeholder = t.storyPhLoc;
    document.getElementById('story-scheme').placeholder = t.storyPhScheme;
    document.getElementById('story-amount').placeholder = t.storyPhAmount;
    document.getElementById('story-text').placeholder   = t.storyPhText;

    // Story biztype options
    const storyBiz = document.getElementById('story-biztype');
    storyBiz.options[0].text = t.phType;
    storyBiz.options[1].text = t.storyOptAgri;
    storyBiz.options[2].text = t.storyOptFood;
    storyBiz.options[3].text = t.storyOptTextile;
    storyBiz.options[4].text = t.storyOptDairy;
    storyBiz.options[5].text = t.storyOptMfg;
    storyBiz.options[6].text = t.storyOptSHG;
    storyBiz.options[7].text = t.storyOptOther;

    const photoText = document.querySelector('.photo-upload-text');
    if (photoText) photoText.textContent = t.photoUploadText;
    const photoSub = document.querySelector('.photo-upload-sub');
    if (photoSub) photoSub.textContent = t.photoUploadSub;

    const submitBtn = document.getElementById('submit-text');
    if (submitBtn && submitBtn.textContent !== t.submittingBtn && submitBtn.textContent !== t.submittedBtn) {
      submitBtn.textContent = t.submitStoryBtn;
    }
  }

  // HISTORY PAGE
  const historyHero = document.querySelector('#page-history .generic-hero');
  if (historyHero) {
    const lbl = historyHero.querySelector('.section-label');
    if (lbl) lbl.textContent = t.historyLabel;
    const h1 = historyHero.querySelector('h1');
    if (h1) h1.innerHTML = t.historyTitle;
    const p = historyHero.querySelector('p');
    if (p) p.textContent = t.historySub;
  }

  // EMAIL MODAL
  const modalHdr = document.querySelector('.modal-hdr h3');
  if (modalHdr) modalHdr.textContent = t.emailModalTitle;
  const modalLoadingP = document.querySelector('#email-loading-state p');
  if (modalLoadingP) modalLoadingP.textContent = t.emailLoadingMsg;
  const emailFields = document.querySelectorAll('.email-field label');
  if (emailFields[0]) emailFields[0].textContent = t.emailSubjectLbl;
  if (emailFields[1]) emailFields[1].textContent = t.emailBodyLbl;
  const emailCopyBtn = document.querySelector('.email-copy-btn');
  if (emailCopyBtn && emailCopyBtn.textContent !== t.emailCopiedBtn) emailCopyBtn.textContent = t.emailCopyBtn;
  const emailSendBtn = document.querySelector('.email-send-btn');
  if (emailSendBtn) emailSendBtn.textContent = t.emailSendBtn;
  const emailNote = document.querySelector('.email-note');
  if (emailNote) emailNote.textContent = t.emailNote;

  // Re-translate score summary if results are showing
  if (currentResults && lang !== 'en') translateSummary(lang);
  if (lang === 'en' && currentResults) {
    const sumEl = document.getElementById('score-summary');
    if (sumEl && sumEl.dataset.original) sumEl.textContent = sumEl.dataset.original;
  }
}

async function translateSummary(lang) {
  const el = document.getElementById('score-summary');
  if (!el || !el.dataset.original) return;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: el.dataset.original, target: lang })
    });
    const text = await res.text();
    if (!text) return;
    const data = JSON.parse(text);
    if (data.translatedText) el.textContent = data.translatedText;
  } catch(e) {}
}

// ════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════
function showPage(page) {
  ['home','stories','history'].forEach(p => {
    document.getElementById('page-' + p).classList.toggle('hidden', p !== page);
    const btn = document.getElementById('nav-' + (p === 'home' ? 'home' : p));
    if (btn) btn.classList.toggle('active', p === page);
  });
  if (page === 'stories') loadStoriesPage();
  if (page === 'history') loadHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════
// CHAR COUNTERS
// ════════════════════════════════════════════
document.getElementById('biz-desc').addEventListener('input', function() {
  document.getElementById('char-count').textContent = this.value.length;
});
document.getElementById('story-text').addEventListener('input', function() {
  document.getElementById('story-char').textContent = this.value.length;
});

// ════════════════════════════════════════════
// ANALYSIS FLOW
// ════════════════════════════════════════════
async function runAnalysis() {
  const t = T[currentLang];
  currentBiz = {
    name: document.getElementById('biz-name').value.trim(),
    type: document.getElementById('biz-type').value,
    state: document.getElementById('biz-state').value,
    revenue: document.getElementById('biz-revenue').value,
    age: document.getElementById('biz-age').value,
    sector: document.getElementById('biz-sector').value,
    desc: document.getElementById('biz-desc').value.trim()
  };

  if (!currentBiz.type || !currentBiz.state || !currentBiz.sector || !currentBiz.revenue || !currentBiz.age) {
    alert(t.alertFillFields);
    return;
  }

  hide('step-form');
  show('step-loading');
  hide('step-results');

  const fill = document.getElementById('loading-fill');
  const msg  = document.getElementById('loading-msg');

  const steps = [
    { pct: 20, text: t.loadingStep1 },
    { pct: 45, text: t.loadingStep2 },
    { pct: 70, text: t.loadingStep3 },
    { pct: 88, text: t.loadingStep4 }
  ];

  fill.style.transition = 'none';
  fill.style.width = '0%';

  let si = 0;
  const anim = setInterval(() => {
    if (si < steps.length) {
      fill.style.transition = 'width 2.5s ease';
      fill.style.width = steps[si].pct + '%';
      msg.textContent = steps[si].text;
      si++;
    }
  }, 2600);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentBiz)
    });
    clearInterval(anim);

    const text = await res.text();
    if (!text) throw new Error('Server returned empty response');
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || 'Server error ' + res.status);

    currentResults = data;

    fill.style.transition = 'width 0.4s ease';
    fill.style.width = '100%';
    msg.textContent = '✓ ' + data.agent2.schemes.length + ' ' + t.schemesHdr;

    await new Promise(r => setTimeout(r, 600));
    renderResults(data.agent1, data.agent2);
    hide('step-loading');
    show('step-results');

  } catch(err) {
    clearInterval(anim);
    alert('Error: ' + err.message);
    show('step-form');
    hide('step-loading');
  }
}

// ════════════════════════════════════════════
// RENDER RESULTS
// ════════════════════════════════════════════
function renderResults(a1, a2) {
  const t = T[currentLang];
  const offset = 314 - (a1.score / 100) * 314;
  document.getElementById('score-num').textContent = a1.score;
  const sumEl = document.getElementById('score-summary');
  sumEl.textContent = a1.summary;
  sumEl.dataset.original = a1.summary;

  setTimeout(() => {
    const c = document.getElementById('score-circle');
    c.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)';
    c.style.strokeDashoffset = offset;
  }, 150);

  document.getElementById('strengths-row').innerHTML = (a1.strengths||[]).map(s => `<span class="tag">✓ ${s}</span>`).join('');
  document.getElementById('gaps-row').innerHTML = (a1.gaps||[]).map(g => `<span class="tag">⚠ ${g}</span>`).join('');

  const list = document.getElementById('schemes-list');
  document.getElementById('schemes-count').textContent = `${a2.schemes.length} ${t.schemesHdr}`;
  list.innerHTML = '';
  window._schemes = a2.schemes;

  a2.schemes.forEach((sc, i) => {
    const isOngoing = !sc.deadline || sc.deadline.toLowerCase().includes('ongoing');
    const deadlineClass = isOngoing ? 'deadline-badge ongoing' : 'deadline-badge';
    const deadlineText = isOngoing ? t.ongoingBadge : `📅 ${sc.deadline}`;

    const docs = (sc.documents || []).map(d =>
      `<li><input type="checkbox"/> ${d}</li>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'scheme-card' + (i === 0 ? ' open' : '');
    card.innerHTML = `
      <div class="scheme-header" onclick="toggleScheme(this)">
        <div class="scheme-left">
          <div class="scheme-name">${sc.name}</div>
          <div class="scheme-meta">${sc.ministry} · <span class="scheme-benefit">${sc.benefit}</span></div>
        </div>
        <div class="scheme-right">
          <span class="${deadlineClass}">${deadlineText}</span>
          <span class="match-badge">${sc.matchScore}% match</span>
          <span class="chevron">▼</span>
        </div>
      </div>
      <div class="scheme-body">
        <p class="scheme-desc">${sc.description}</p>
        <div class="scheme-actions">
          <button class="action-btn" onclick="copyDocs(this,${i})">${t.copyChecklist}</button>
          <button class="action-btn email-action" onclick="openEmailModal(${i})">${t.draftEmail}</button>
          ${sc.applyUrl ? `<a class="action-btn" href="${sc.applyUrl}" target="_blank" rel="noopener">${t.officialSite}</a>` : ''}
        </div>
        <div class="docs-section-title">${t.docsRequired}</div>
        <ul class="checklist">${docs}</ul>
        <div class="scheme-footer">
          <span class="footer-deadline">${t.deadlinePrefix} ${sc.deadline || t.ongoingBadge}</span>
          ${sc.applyUrl ? `<a class="apply-link" href="${sc.applyUrl}" target="_blank" rel="noopener">${t.applyNow}</a>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  if (currentLang !== 'en') translateSummary(currentLang);
}

function toggleScheme(hdr) { hdr.parentElement.classList.toggle('open'); }

function copyDocs(btn, i) {
  const t = T[currentLang];
  const sc = window._schemes[i];
  const text = `Documents for ${sc.name}:\n` + (sc.documents||[]).map((d,j)=>`${j+1}. ${d}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = t.copiedChecklist;
    setTimeout(() => btn.textContent = t.copyChecklist, 2000);
  });
}

// ════════════════════════════════════════════
// EMAIL MODAL
// ════════════════════════════════════════════
function openEmailModal(idx) {
  currentEmailScheme = window._schemes[idx];
  show('email-modal');
  show('email-loading-state');
  hide('email-ready-state');
  generateEmail();
}

async function generateEmail() {
  const t = T[currentLang];
  try {
    const res = await fetch('/api/email-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biz: currentBiz, scheme: currentEmailScheme })
    });

    const text = await res.text();
    if (!text) throw new Error('Server returned empty response');
    const data = JSON.parse(text);
    if (!res.ok || data.error) throw new Error(data.error || 'Server error ' + res.status);

    document.getElementById('email-subject').textContent = data.subject;
    document.getElementById('email-body').textContent = data.body;
    window._emailData = data;
    hide('email-loading-state');
    show('email-ready-state');

  } catch(err) {
    document.getElementById('email-loading-state').innerHTML =
      `<p style="color:var(--red-soft);text-align:center;padding:1rem">Failed to generate: ${err.message}</p>`;
  }
}

function closeEmailModal() { hide('email-modal'); }
function handleModalClick(e) { if (e.target === e.currentTarget) closeEmailModal(); }

function copyEmail() {
  const t = T[currentLang];
  if (!window._emailData) return;
  const text = `Subject: ${window._emailData.subject}\n\n${window._emailData.body}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.email-copy-btn');
    btn.textContent = t.emailCopiedBtn;
    setTimeout(() => btn.textContent = t.emailCopyBtn, 2000);
  });
}

function openMailto() {
  if (!window._emailData) return;
  window.open(`mailto:?subject=${encodeURIComponent(window._emailData.subject)}&body=${encodeURIComponent(window._emailData.body)}`);
}

// ════════════════════════════════════════════
// STORIES
// ════════════════════════════════════════════
function renderStoryCard(story) {
  const fallback = 'hero1.jpg';
  return `
    <div class="story-card">
      <div class="story-photo-wrap" style="background-image: url('${story.photo || fallback}')">
        <span class="story-amount-tag">${story.amount}</span>
      </div>
      <div class="story-card-body">
        <div class="story-card-name">${story.name}</div>
        <div class="story-card-loc">📍 ${story.location}</div>
        <div class="story-card-scheme">${story.scheme}</div>
        <div class="story-card-text">"${story.text.substring(0, 140)}${story.text.length > 140 ? '...' : ''}"</div>
      </div>
    </div>
  `;
}

function loadStoriesHome() {
  const strip = document.getElementById('home-stories-strip');
  const preview = SAMPLE_STORIES.slice(0, 3);
  strip.innerHTML = preview.map(renderStoryCard).join('');
}

function loadStoriesPage() {
  const t = T[currentLang];
  const grid = document.getElementById('stories-grid');
  const userStories = JSON.parse(localStorage.getItem('gfn_stories') || '[]');
  const all = [...SAMPLE_STORIES, ...userStories].slice(0, 21);
  grid.innerHTML = all.map(renderStoryCard).join('');

  const used = getWeekUploads();
  const remaining = WEEKLY_LIMIT - used;
  const slotsEl = document.getElementById('slots-remaining');
  if (slotsEl) {
    slotsEl.textContent = remaining > 0
      ? `${remaining} / ${WEEKLY_LIMIT} ${currentLang === 'en' ? 'slots remaining this week' : currentLang === 'hi' ? 'स्लॉट इस हफ्ते बचे हैं' : 'ಸ್ಲಾಟ್‌ಗಳು ಈ ವಾರ ಉಳಿದಿವೆ'}`
      : t.alertWeekFull;
  }
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('photo-preview');
    preview.src = e.target.result;
    show('photo-preview');
  };
  reader.readAsDataURL(file);
}

async function submitStory() {
  const t = T[currentLang];
  const used = getWeekUploads();
  if (used >= WEEKLY_LIMIT) {
    alert(t.alertWeekFull);
    return;
  }

  const name     = document.getElementById('story-name').value.trim();
  const location = document.getElementById('story-location').value.trim();
  const bizType  = document.getElementById('story-biztype').value;
  const scheme   = document.getElementById('story-scheme').value.trim();
  const amount   = document.getElementById('story-amount').value.trim();
  const text     = document.getElementById('story-text').value.trim();

  if (!name || !location || !scheme || !text) {
    alert(t.alertStoryFields);
    return;
  }

  const btn = document.getElementById('submit-text');
  btn.textContent = t.submittingBtn;

  const photoInput = document.getElementById('story-photo');
  let photoData = null;

  if (photoInput.files[0]) {
    photoData = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(photoInput.files[0]);
    });
  }

  const story = {
    name, location, bizType, scheme,
    amount: amount ? '₹' + amount.replace('₹','') : '',
    text,
    photo: photoData || 'hero1.jpg',
    week: true,
    submittedAt: new Date().toISOString()
  };

  const existing = JSON.parse(localStorage.getItem('gfn_stories') || '[]');
  existing.unshift(story);
  localStorage.setItem('gfn_stories', JSON.stringify(existing.slice(0, 50)));
  incWeekUploads();

  btn.textContent = t.submittedBtn;
  setTimeout(() => {
    btn.textContent = t.submitStoryBtn;
    document.getElementById('story-name').value    = '';
    document.getElementById('story-location').value = '';
    document.getElementById('story-scheme').value  = '';
    document.getElementById('story-amount').value  = '';
    document.getElementById('story-text').value    = '';
    document.getElementById('story-char').textContent = '0';
    hide('photo-preview');
    loadStoriesPage();
    document.getElementById('stories-grid').scrollIntoView({ behavior: 'smooth' });
  }, 1500);
}

// ════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════
async function loadHistory() {
  const t = T[currentLang];
  const list = document.getElementById('history-list');
  list.innerHTML = `<p style="color:var(--muted);text-align:center;padding:2rem">${t.historyLoading}</p>`;
  try {
    const res = await fetch('/api/history');
    const text = await res.text();
    if (!text) throw new Error('Empty response');
    const data = JSON.parse(text);

    if (!data.length) {
      list.innerHTML = `<div class="empty-state"><p style="font-size:2rem;margin-bottom:0.5rem">📭</p><p>${t.historyEmpty}</p></div>`;
      return;
    }
    list.innerHTML = data.map(row => `
      <div class="history-card">
        <div>
          <div class="history-name">${row.business_name || 'Unnamed'}</div>
          <div class="history-meta">${row.business_type} · ${row.state} · ${row.sector} · ${new Date(row.created_at).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="history-score">${row.score}</div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = `<p style="color:var(--muted);text-align:center">${t.historyError}</p>`;
  }
}

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function resetAgentBoxes() {
  ['pv1','pv2','pv3','pv4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'agent-box';
  });
  ['ps1','ps2','ps3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Waiting';
  });
  const ps4 = document.getElementById('ps4');
  if (ps4) ps4.textContent = 'On Demand';
}

function resetApp() {
  hide('step-results');
  show('step-form');
  document.getElementById('score-circle').style.strokeDashoffset = '314';
  resetAgentBoxes();
  currentResults = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
loadStoriesHome();