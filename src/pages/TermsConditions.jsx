import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Download, FileText, Calendar, Scale, ShieldAlert, Award } from "lucide-react";

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "Introduction & Recitals" },
    { id: "definitions", title: "1. Definitions" },
    { id: "eligibility", title: "2. Eligibility & Accounts" },
    { id: "services", title: "3. Platform Services & Roles" },
    { id: "conduct", title: "4. User Conduct" },
    { id: "intellectual-property", title: "5. User Content & IP" },
    { id: "events-prizes", title: "6. Event Participation & Prizes" },
    { id: "warranties", title: "7. Disclaimer of Warranties" },
    { id: "liability", title: "8. Limitation of Liability" },
    { id: "indemnification", title: "9. Indemnification" },
    { id: "modifications", title: "10. Modifications" },
    { id: "privacy", title: "11. Privacy Policy" },
    { id: "third-party", title: "12. Third-Party Links" },
    { id: "severability", title: "13. Severability" },
    { id: "entire-agreement", title: "14. Entire Agreement" },
    { id: "waiver", title: "15. Waiver" },
    { id: "assignment", title: "16. Assignment" },
    { id: "force-majeure", title: "17. Force Majeure" },
    { id: "governing-law", title: "18. Governing Law & Jurisdiction" },
    { id: "contact-info", title: "19. Contact Information" }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a1414] text-gray-200 font-urbanist relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-[#022f2e]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-[#0a1414]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9ae600]" />
                <h1 className="text-xl font-bold text-white tracking-wide">Lenient Tree</h1>
              </div>
              <p className="text-xs text-gray-400">Terms and Conditions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-300 text-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Terms</span>
            </button>
            <a
              href="/TERMS AND CONDITIONS - Lenient Tree.pdf"
              download="TERMS AND CONDITIONS - Lenient Tree.pdf"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#9ae600] to-[#b3f52a] hover:from-[#b3f52a] hover:to-[#9ae600] text-[#0a1414] font-bold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-[#9ae600]/10"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header Page Title */}
      <section className="bg-gradient-to-b from-[#022f2e]/30 to-transparent py-16 px-6 relative border-b border-white/5">
        <div className="max-w-7xl mx-auto text-center md:text-left md:flex md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold text-[#9ae600] uppercase tracking-[0.2em] mb-2 block">
              Legal Documents
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Terms &amp; Conditions
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
              Please read these Terms and Conditions carefully. They constitute a legally binding agreement governing your access to and use of the Lenient Tree Platform.
            </p>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4 justify-center md:justify-end text-sm text-gray-400">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[140px]">
              <Calendar className="w-5 h-5 text-[#9ae600] mb-2" />
              <span>Last Updated</span>
              <span className="text-white font-semibold mt-1">May 28, 2026</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[140px]">
              <Scale className="w-5 h-5 text-[#9ae600] mb-2" />
              <span>Jurisdiction</span>
              <span className="text-white font-semibold mt-1">Ernakulam, Kerala</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-28 bg-white/5 border border-white/10 rounded-3xl p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider border-b border-white/10 pb-2">
                Table of Contents
              </h3>
              <ul className="space-y-1.5 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left py-2 px-3 rounded-xl transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-[#9ae600]/10 text-[#9ae600] font-semibold pl-4"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Policy Text Content */}
          <main className="lg:col-span-3 space-y-12 text-gray-300 leading-relaxed select-text">
            
            {/* Introduction */}
            <section id="introduction" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                Introduction &amp; Recitals
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  Welcome to Lenient Tree, a Proprietary concern (<a href="https://www.lenienttree.com/" className="text-[#9ae600] hover:underline">https://www.lenienttree.com/</a>). These Terms and Conditions (<strong>&quot;Terms&quot;</strong>) constitute a legally binding agreement made between you, whether personally or on behalf of an entity (<strong>&quot;you&quot;, &quot;your&quot;,</strong> or <strong>&quot;User&quot;</strong>) and Lenient Tree (<strong>&quot;we&quot;, &quot;us&quot;,</strong> or <strong>&quot;our&quot;</strong>), concerning your access to and use of the Lenient Tree website, mobile applications, and any other online services or platforms provided by us (collectively, the <strong>&quot;Platform&quot;</strong>).
                </p>
                <p>
                  Please read these Terms carefully before accessing or using our Platform. By accessing, browsing, registering an account, or using the Platform in any manner, you acknowledge that you have read, understood, and agree to be bound by all of these Terms and Conditions, as well as our Privacy Policy.
                </p>
                <p>
                  These Terms are effective as of May 28, 2026. We reserve the right, in our sole discretion, to make changes or modifications to these Terms at any time and for any reason.
                </p>
                <div className="bg-[#022f2e]/20 border-l-4 border-[#9ae600] p-4 rounded-r-xl mt-4 text-sm text-gray-400">
                  <strong>RECITALS:</strong>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Lenient Tree operates a specialized online aggregator located at www.lenienttree.com designed to aggregate, host, and list technology-driven events (hackathons, ideathons, webinars, conclaves).</li>
                    <li>The Platform connects tech enthusiasts, students, and professionals with opportunities for skill development.</li>
                    <li>Lenient Tree acts as an intermediary and digital infrastructure provider, streamlining interactions between event organizers and participants.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 1: Definitions */}
            <section id="definitions" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                1. Definitions
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.1 Agreement</h4>
                  <p>Refers to these Terms and Conditions, the Privacy Policy, and all other operating rules, policies, and procedures published on the Platform.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.2 Content</h4>
                  <p>All information, text, software, graphics, photos, interactive features, and trademarks accessible via the Platform.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.3 Events</h4>
                  <p>Hackathons, ideathons, webinars, conclaves, workshops, technical competitions, listed or hosted on the Platform.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.4 Platform</h4>
                  <p>Refers to the website https://www.lenienttree.com/, mobile applications, and online utilities owned and operated by Lenient Tree.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.5 Services</h4>
                  <p>Full suite of digital offerings, including event aggregation, accounts, certificate galleries, event calendars, and participant communication tools.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.6 Third-Party Event Organizers</h4>
                  <p>External entities, including academic institutions, student chapters, or corporate sponsors, who organize or host listed Events.</p>
                </div>
              </div>
            </section>

            {/* Section 2: Eligibility */}
            <section id="eligibility" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                2. Eligibility and Account Registration
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.1 Age of Majority &amp; Parental Consent</h4>
                  <p>Access is restricted to individuals at least 18 years of age. Users under 18 (&quot;Child&quot;) represent that they have obtained the verifiable consent of a parent or lawful guardian who agrees to be bound by these Terms.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.2 Account Creation</h4>
                  <p>Certain features (e.g., registering for LenientHack, event calendar, certificate gallery) require account registration. You must provide true, accurate, current, and complete information.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.3 Account Security</h4>
                  <p>You are solely responsible for maintaining the confidentiality of your account credentials and password, and assume full responsibility for all activities under your account.</p>
                </div>
              </div>
            </section>

            {/* Section 3: Services */}
            <section id="services" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                3. Platform Services and Roles
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  Lenient Tree acts solely as an aggregator and facilitator. Unless explicitly designated as a &quot;Lenient Tree Proprietary Event,&quot; all Events are managed by external, independent third-party organizers.
                </p>
                <div className="bg-[#022f2e]/10 border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-white font-bold text-base mb-2">Operational Boundaries:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                    <li>Lenient Tree exercises no editorial or operational control over third-party Events.</li>
                    <li>Schedules, venues, entry requirements, and rules are determined exclusively by the respective organizers.</li>
                    <li>Descriptions, dates, or terms of third-party Events are sourced from organizers. Any reliance on them is at the User&apos;s own risk.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Conduct */}
            <section id="conduct" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                4. User Conduct and Prohibited Activities
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>You agree to utilize the Platform in compliance with the Information Technology Act, 2000, DPDPA 2023, and all applicable laws. You shall not:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>Post content that is defamatory, obscene, invasive of privacy, or infringes intellectual property.</li>
                  <li>Engage in plagiarism (e.g., submitting pre-existing code as original work) or cheating in competitions.</li>
                  <li>Use automated scrapers, spiders, or robots to harvest Platform data.</li>
                  <li>Circumvent security-related features or attempt unauthorized access to other user accounts.</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section id="intellectual-property" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                5. User-Generated Content &amp; Intellectual Property
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">5.1 Ownership of User Content</h4>
                  <p>You retain all proprietary rights (copyright, source code, portfolios) in materials you upload. Lenient Tree does not claim ownership over your original work.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">5.2 License Grant to the Platform</h4>
                  <p>By submitting content, you grant Lenient Tree a perpetual, irrevocable, worldwide, non-exclusive, royalty-free, transferable license to use, host, reproduce, and display it for operating and marketing the Platform.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">5.3 Platform Rights</h4>
                  <p>All design, source code, logos, trademarks, and features of the Platform are the exclusive property of Lenient Tree and are protected by the Copyright Act, 1957, and Trade Marks Act, 1999.</p>
                </div>
              </div>
            </section>

            {/* Section 6: Events & Prizes */}
            <section id="events-prizes" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                6. Event Participation, Sponsorships, and Prizes
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  Any prizes, rewards, grants, or certificates promised in connection with an Event are provided and fulfilled exclusively by the third-party organizers or corporate sponsors associated with that Event.
                </p>
                <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl">
                  <h4 className="text-red-400 font-bold text-base mb-2">Disclaimer of Event Liability:</h4>
                  <p className="text-sm text-gray-400">
                    Lenient Tree is not liable for Event cancellations, judging disputes, scoring controversies, or failures of sponsors/organizers to deliver promised rewards. Disputes must be settled directly with the organizers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Warranties */}
            <section id="warranties" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                7. Disclaimer of Warranties
              </h3>
              <p className="text-sm sm:text-base">
                The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Lenient Tree disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, security, or that service will be uninterrupted or error-free.
              </p>
            </section>

            {/* Section 8: Liability */}
            <section id="liability" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                8. Limitation of Liability
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  To the maximum extent permitted by Indian law, Lenient Tree, its founders, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
                </p>
                <div className="bg-[#022f2e]/30 border border-[#9ae600]/30 p-5 rounded-2xl">
                  <h4 className="text-white font-bold text-base mb-1">Liability Cap:</h4>
                  <p className="text-lg font-bold text-[#9ae600] mb-2">INR 1,000 (Rupees One Thousand Only)</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    The total aggregate liability of Lenient Tree for all claims relating to the Platform shall not exceed INR 1,000 or the amount paid by the User to Lenient Tree during the three (3) months preceding the claim, whichever is lower.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9: Indemnification */}
            <section id="indemnification" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                9. Indemnification
              </h3>
              <p className="text-sm sm:text-base">
                You agree to defend, indemnify, and hold harmless Lenient Tree and its affiliates from any claims, suits, liabilities, losses, costs, or expenses (including attorney fees) arising from your access, use, or misuse of the Platform, your User Content, your breach of these Terms, or your violation of applicable laws (including IT Act and DPDPA).
              </p>
            </section>

            {/* Section 10: Modifications */}
            <section id="modifications" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                10. Modifications to the Terms and Service
              </h3>
              <p className="text-sm sm:text-base">
                We reserve the right to amend these Terms at any time. Modifications are effective immediately upon posting. Your continued use of the Platform signifies acceptance of revised terms. We also reserve the right to modify, suspend, or discontinue any part of the Platform without notice or liability.
              </p>
            </section>

            {/* Section 11: Privacy Policy */}
            <section id="privacy" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                11. Privacy Policy
              </h3>
              <p className="text-sm sm:text-base">
                We act as a Data Fiduciary under the DPDPA 2023. Our data processing practices are outlined in our <Link to="/privacy" className="text-[#9ae600] hover:underline font-semibold">Privacy Policy</Link>, which is incorporated herein by reference.
              </p>
            </section>

            {/* Section 12: Third-Party Links */}
            <section id="third-party" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                12. Third-Party Links
              </h3>
              <p className="text-sm sm:text-base">
                The Platform may contain links to external sites. We assume no responsibility for the content, privacy policies, or practices of third-party services. Accessing these links is strictly at your own risk.
              </p>
            </section>

            {/* Section 13: Severability */}
            <section id="severability" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                13. Severability
              </h3>
              <p className="text-sm sm:text-base">
                If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* Section 14: Entire Agreement */}
            <section id="entire-agreement" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                14. Entire Agreement
              </h3>
              <p className="text-sm sm:text-base">
                These Terms, the Privacy Policy, and any event-specific codes of conduct constitute the entire agreement between the User and Lenient Tree with respect to the Platform, superseding all prior communications or proposals.
              </p>
            </section>

            {/* Section 15: Waiver */}
            <section id="waiver" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                15. Waiver
              </h3>
              <p className="text-sm sm:text-base">
                No waiver by Lenient Tree of any term or condition set forth in these Terms shall be deemed a further or continuing waiver, and must be in writing to be effective.
              </p>
            </section>

            {/* Section 16: Assignment */}
            <section id="assignment" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                16. Assignment
              </h3>
              <p className="text-sm sm:text-base">
                The User may not assign or transfer their rights under these Terms. Lenient Tree reserves the unilateral right to assign or delegate its rights and obligations in the event of a merger, acquisition, or asset sale.
              </p>
            </section>

            {/* Section 17: Force Majeure */}
            <section id="force-majeure" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                17. Force Majeure
              </h3>
              <p className="text-sm sm:text-base">
                Lenient Tree shall not be held liable for any failure or delay in performance when caused by events beyond its reasonable control, including acts of God, war, pandemic lockdowns, cyber-attacks, power failures, or internet disruptions.
              </p>
            </section>

            {/* Section 18: Governing Law */}
            <section id="governing-law" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                18. Governing Law and Jurisdiction
              </h3>
              <p className="text-sm sm:text-base">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. You agree to submit to the exclusive jurisdiction of the courts located in Ernakulam, Kerala, India, to resolve any legal disputes.
              </p>
            </section>

            {/* Section 19: Contact Information */}
            <section id="contact-info" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                19. Contact Information
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  For any questions or general inquiries regarding these Terms or the Platform, please contact our support team:
                </p>
                <div className="bg-[#022f2e]/10 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Support Email</span>
                    <a href="mailto:support@lenienttree.com" className="text-white font-bold text-lg hover:text-[#9ae600] transition-colors">
                      support@lenienttree.com
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Grievances (DPDPA)</span>
                    <a href="mailto:support@lenienttree.com?subject=Attn:%20DPDPA%20Grievance%20Officer" className="text-white font-bold text-lg hover:text-[#9ae600] transition-colors">
                      Attn: DPDPA Grievance Officer
                    </a>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Modern footer spacing */}
      <div className="border-t border-white/10 py-8 text-center text-xs text-gray-500 bg-[#060e0e]">
        <p>© 2026 The Lenient Tree. All rights reserved. Subject to the jurisdiction of courts in Ernakulam, Kerala.</p>
      </div>
    </div>
  );
}
