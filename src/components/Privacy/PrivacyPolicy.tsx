import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Language } from '../../lib/i18n';
import { LanguageSelector } from '../LanguageSelector';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

const CONTACT_EMAIL = 'contact@invitstudio.com';
const LAST_UPDATED = 'June 4, 2026';

const content = {
  en: {
    title: 'Privacy Policy',
    subtitle: 'How Invit Studio collects, uses and protects your personal data.',
    back: 'Back',
    updated: `Last updated: ${LAST_UPDATED}`,
    intro:
      'Invit Studio helps users create, personalize and share digital invitations. This Privacy Policy explains what personal data we collect, why we collect it, how we protect it, and what rights you have.',
    sections: [
      {
        title: '1. Who we are',
        text:
          'Invit Studio is operated by CréaTHINKS / Invit Studio. For privacy questions, you can contact us at ' + CONTACT_EMAIL + '.'
      },
      {
        title: '2. Data we collect',
        text:
          'We may collect your email address, authentication information, invitation content, host names, event date and address, uploaded photos or music, RSVP responses, guest names, optional guest messages, payment status, activation codes, and technical information needed to operate the service.'
      },
      {
        title: '3. Why we use your data',
        text:
          'We use your data to create and display invitations, manage your account, save your projects, collect guest responses, activate Premium access, provide customer support, secure the service, and comply with legal obligations.'
      },
      {
        title: '4. Legal basis and consent',
        text:
          'Where required, we process personal data based on your consent, the performance of the service you request, our legitimate interest in operating and securing the platform, or legal obligations. You may withdraw consent where applicable.'
      },
      {
        title: '5. Guest data',
        text:
          'When guests respond to an invitation, we collect the information they submit, such as name, number of guests, age where requested, and optional messages. This information is shown to the invitation creator.'
      },
      {
        title: '6. Payments',
        text:
          'Payments may be processed by third-party payment providers such as VietQR/SePay or card payment providers when available. We do not store full card details. Payment providers may process data according to their own privacy policies.'
      },
      {
        title: '7. Third-party services',
        text:
          'We use service providers such as Supabase for database, authentication and storage, Google for Google sign-in, hosting providers, and payment providers. These providers process data only as needed to provide the service.'
      },
      {
        title: '8. Data storage and transfers',
        text:
          'Your data may be stored or processed outside your country, depending on the location of our service providers. We take reasonable measures to protect personal data during storage and transfer.'
      },
      {
        title: '9. Data retention',
        text:
          'We keep your data only as long as necessary to provide the service, maintain your account, comply with legal obligations, resolve disputes, or prevent abuse. You may request deletion of your account and associated data.'
      },
      {
        title: '10. Security',
        text:
          'We use technical and organizational measures to protect personal data, including access controls, secured hosting, authentication, and restricted access to user data. No online service can guarantee absolute security.'
      },
      {
        title: '11. Your rights',
        text:
          'Depending on your location, including under the GDPR and Vietnamese personal data protection rules, you may have the right to access, correct, delete, restrict, object to processing, withdraw consent, or request a copy of your personal data.'
      },
      {
        title: '12. Children',
        text:
          'Invit Studio is not intended for children under the age required by applicable law. If you believe a child has provided personal data without proper consent, please contact us.'
      },
      {
        title: '13. No sale of personal data',
        text:
          'We do not sell your personal data. We do not use your invitation content or guest lists for advertising resale.'
      },
      {
        title: '14. Changes to this policy',
        text:
          'We may update this Privacy Policy from time to time. If important changes are made, we will make reasonable efforts to notify users.'
      },
      {
        title: '15. Contact',
        text:
          'For any privacy request, account deletion request, or question, contact us at ' + CONTACT_EMAIL + '.'
      }
    ]
  },
  fr: {
    title: 'Politique de confidentialité',
    subtitle: 'Comment Invit Studio collecte, utilise et protège vos données personnelles.',
    back: 'Retour',
    updated: `Dernière mise à jour : ${LAST_UPDATED}`,
    intro:
      'Invit Studio permet de créer, personnaliser et partager des invitations digitales. Cette politique explique quelles données personnelles nous collectons, pourquoi, comment nous les protégeons et quels sont vos droits.',
    sections: [
      {
        title: '1. Qui sommes-nous',
        text:
          'Invit Studio est exploité par CréaTHINKS / Invit Studio. Pour toute question liée à la confidentialité, vous pouvez nous contacter à ' + CONTACT_EMAIL + '.'
      },
      {
        title: '2. Données collectées',
        text:
          'Nous pouvons collecter votre adresse email, vos informations de connexion, le contenu de vos invitations, les noms des hôtes, la date et l’adresse de l’événement, les photos ou musiques importées, les réponses RSVP, les noms des invités, les messages optionnels, le statut de paiement, les codes d’activation et les informations techniques nécessaires au fonctionnement du service.'
      },
      {
        title: '3. Pourquoi nous utilisons vos données',
        text:
          'Nous utilisons vos données pour créer et afficher les invitations, gérer votre compte, sauvegarder vos projets, collecter les réponses des invités, activer l’accès Premium, fournir le support client, sécuriser le service et respecter nos obligations légales.'
      },
      {
        title: '4. Base légale et consentement',
        text:
          'Lorsque nécessaire, nous traitons les données sur la base de votre consentement, de l’exécution du service demandé, de notre intérêt légitime à exploiter et sécuriser la plateforme, ou d’obligations légales. Vous pouvez retirer votre consentement lorsque cela s’applique.'
      },
      {
        title: '5. Données des invités',
        text:
          'Quand un invité répond à une invitation, nous collectons les informations qu’il renseigne, comme son nom, le nombre de personnes, l’âge si demandé, et les messages optionnels. Ces informations sont visibles par le créateur de l’invitation.'
      },
      {
        title: '6. Paiements',
        text:
          'Les paiements peuvent être traités par des prestataires tiers comme VietQR/SePay ou des prestataires de paiement par carte lorsque disponibles. Nous ne stockons pas les données complètes de carte bancaire. Ces prestataires peuvent traiter des données selon leurs propres politiques de confidentialité.'
      },
      {
        title: '7. Services tiers',
        text:
          'Nous utilisons des prestataires comme Supabase pour la base de données, l’authentification et le stockage, Google pour la connexion Google, des services d’hébergement et des prestataires de paiement. Ces prestataires traitent les données uniquement lorsque cela est nécessaire au service.'
      },
      {
        title: '8. Stockage et transferts',
        text:
          'Vos données peuvent être stockées ou traitées en dehors de votre pays selon l’emplacement de nos prestataires. Nous prenons des mesures raisonnables pour protéger les données pendant leur stockage et leur transfert.'
      },
      {
        title: '9. Durée de conservation',
        text:
          'Nous conservons vos données uniquement le temps nécessaire pour fournir le service, maintenir votre compte, respecter nos obligations légales, résoudre les litiges ou prévenir les abus. Vous pouvez demander la suppression de votre compte et des données associées.'
      },
      {
        title: '10. Sécurité',
        text:
          'Nous utilisons des mesures techniques et organisationnelles pour protéger les données personnelles, notamment des contrôles d’accès, un hébergement sécurisé, l’authentification et un accès restreint aux données utilisateurs. Aucun service en ligne ne peut garantir une sécurité absolue.'
      },
      {
        title: '11. Vos droits',
        text:
          'Selon votre pays, notamment au titre du RGPD et des règles vietnamiennes de protection des données personnelles, vous pouvez disposer d’un droit d’accès, de correction, de suppression, de limitation, d’opposition, de retrait du consentement ou de demande de copie de vos données.'
      },
      {
        title: '12. Enfants',
        text:
          'Invit Studio n’est pas destiné aux enfants n’ayant pas l’âge requis par la loi applicable. Si vous pensez qu’un enfant a fourni des données sans consentement approprié, contactez-nous.'
      },
      {
        title: '13. Pas de vente de données',
        text:
          'Nous ne vendons pas vos données personnelles. Nous n’utilisons pas le contenu de vos invitations ni vos listes d’invités pour les revendre à des fins publicitaires.'
      },
      {
        title: '14. Modifications',
        text:
          'Nous pouvons mettre à jour cette politique de confidentialité. En cas de changement important, nous ferons des efforts raisonnables pour informer les utilisateurs.'
      },
      {
        title: '15. Contact',
        text:
          'Pour toute demande liée à la confidentialité, à la suppression de compte ou à vos données, contactez-nous à ' + CONTACT_EMAIL + '.'
      }
    ]
  },
  vi: {
    title: 'Chính sách quyền riêng tư',
    subtitle: 'Cách Invit Studio thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.',
    back: 'Quay lại',
    updated: `Cập nhật lần cuối: ${LAST_UPDATED}`,
    intro:
      'Invit Studio giúp người dùng tạo, tùy chỉnh và chia sẻ thiệp mời kỹ thuật số. Chính sách này giải thích dữ liệu cá nhân nào được thu thập, lý do thu thập, cách chúng tôi bảo vệ dữ liệu và các quyền của bạn.',
    sections: [
      {
        title: '1. Chúng tôi là ai',
        text:
          'Invit Studio được vận hành bởi CréaTHINKS / Invit Studio. Nếu có câu hỏi về quyền riêng tư, bạn có thể liên hệ với chúng tôi qua ' + CONTACT_EMAIL + '.'
      },
      {
        title: '2. Dữ liệu chúng tôi thu thập',
        text:
          'Chúng tôi có thể thu thập địa chỉ email, thông tin đăng nhập, nội dung thiệp mời, tên chủ tiệc, ngày và địa chỉ sự kiện, ảnh hoặc nhạc được tải lên, phản hồi RSVP, tên khách mời, tin nhắn tùy chọn, trạng thái thanh toán, mã kích hoạt và thông tin kỹ thuật cần thiết để vận hành dịch vụ.'
      },
      {
        title: '3. Mục đích sử dụng dữ liệu',
        text:
          'Chúng tôi sử dụng dữ liệu để tạo và hiển thị thiệp mời, quản lý tài khoản, lưu dự án, thu thập phản hồi của khách, kích hoạt quyền truy cập Premium, hỗ trợ khách hàng, bảo mật dịch vụ và tuân thủ nghĩa vụ pháp lý.'
      },
      {
        title: '4. Cơ sở pháp lý và sự đồng ý',
        text:
          'Khi cần thiết, chúng tôi xử lý dữ liệu dựa trên sự đồng ý của bạn, việc thực hiện dịch vụ bạn yêu cầu, lợi ích hợp pháp trong việc vận hành và bảo mật nền tảng, hoặc nghĩa vụ pháp lý. Bạn có thể rút lại sự đồng ý khi pháp luật cho phép.'
      },
      {
        title: '5. Dữ liệu của khách mời',
        text:
          'Khi khách mời phản hồi một thiệp mời, chúng tôi thu thập thông tin mà họ gửi, chẳng hạn như tên, số lượng khách, tuổi nếu được yêu cầu và tin nhắn tùy chọn. Thông tin này được hiển thị cho người tạo thiệp mời.'
      },
      {
        title: '6. Thanh toán',
        text:
          'Thanh toán có thể được xử lý bởi các nhà cung cấp bên thứ ba như VietQR/SePay hoặc nhà cung cấp thanh toán thẻ khi khả dụng. Chúng tôi không lưu trữ đầy đủ thông tin thẻ ngân hàng. Các nhà cung cấp thanh toán có thể xử lý dữ liệu theo chính sách riêng của họ.'
      },
      {
        title: '7. Dịch vụ bên thứ ba',
        text:
          'Chúng tôi sử dụng các nhà cung cấp như Supabase cho cơ sở dữ liệu, xác thực và lưu trữ, Google cho đăng nhập Google, nhà cung cấp lưu trữ và nhà cung cấp thanh toán. Các bên này chỉ xử lý dữ liệu khi cần thiết để cung cấp dịch vụ.'
      },
      {
        title: '8. Lưu trữ và chuyển dữ liệu',
        text:
          'Dữ liệu của bạn có thể được lưu trữ hoặc xử lý bên ngoài quốc gia của bạn tùy thuộc vào vị trí của nhà cung cấp dịch vụ. Chúng tôi áp dụng các biện pháp hợp lý để bảo vệ dữ liệu trong quá trình lưu trữ và chuyển giao.'
      },
      {
        title: '9. Thời gian lưu giữ',
        text:
          'Chúng tôi chỉ lưu giữ dữ liệu trong thời gian cần thiết để cung cấp dịch vụ, duy trì tài khoản, tuân thủ nghĩa vụ pháp lý, giải quyết tranh chấp hoặc ngăn chặn lạm dụng. Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan.'
      },
      {
        title: '10. Bảo mật',
        text:
          'Chúng tôi sử dụng các biện pháp kỹ thuật và tổ chức để bảo vệ dữ liệu cá nhân, bao gồm kiểm soát truy cập, lưu trữ an toàn, xác thực và hạn chế quyền truy cập vào dữ liệu người dùng. Không dịch vụ trực tuyến nào có thể đảm bảo an toàn tuyệt đối.'
      },
      {
        title: '11. Quyền của bạn',
        text:
          'Tùy theo nơi bạn cư trú, bao gồm theo GDPR và quy định bảo vệ dữ liệu cá nhân của Việt Nam, bạn có thể có quyền truy cập, chỉnh sửa, xóa, hạn chế, phản đối việc xử lý, rút lại sự đồng ý hoặc yêu cầu bản sao dữ liệu cá nhân.'
      },
      {
        title: '12. Trẻ em',
        text:
          'Invit Studio không dành cho trẻ em dưới độ tuổi theo quy định pháp luật hiện hành. Nếu bạn cho rằng trẻ em đã cung cấp dữ liệu cá nhân mà không có sự đồng ý phù hợp, vui lòng liên hệ với chúng tôi.'
      },
      {
        title: '13. Không bán dữ liệu cá nhân',
        text:
          'Chúng tôi không bán dữ liệu cá nhân của bạn. Chúng tôi không sử dụng nội dung thiệp mời hoặc danh sách khách mời của bạn để bán lại cho mục đích quảng cáo.'
      },
      {
        title: '14. Thay đổi chính sách',
        text:
          'Chúng tôi có thể cập nhật Chính sách quyền riêng tư này theo thời gian. Nếu có thay đổi quan trọng, chúng tôi sẽ nỗ lực hợp lý để thông báo cho người dùng.'
      },
      {
        title: '15. Liên hệ',
        text:
          'Đối với mọi yêu cầu về quyền riêng tư, yêu cầu xóa tài khoản hoặc câu hỏi về dữ liệu, vui lòng liên hệ ' + CONTACT_EMAIL + '.'
      }
    ]
  }
};

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('invite_lang', newLang);
  };

  const t = content[lang] || content.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800">
      <div className="fixed top-5 right-5 z-50">
        <LanguageSelector currentLang={lang} onLangChange={handleLangChange} />
      </div>

      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        <div className="mb-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft size={16} />
              {t.back}
            </button>
          )}

          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 border border-amber-100">
            <ShieldCheck size={26} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
            {t.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed">
            {t.subtitle}
          </p>

          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
            {t.updated}
          </p>
        </div>

        <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 shadow-sm mb-5">
          <p className="text-sm leading-7 text-gray-600">
            {t.intro}
          </p>
        </section>

        <div className="space-y-4">
          {t.sections.map((section) => (
            <section
              key={section.title}
              className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 shadow-sm"
            >
              <h2 className="text-base font-black text-gray-950 mb-3">
                {section.title}
              </h2>

              <p className="text-sm leading-7 text-gray-600">
                {section.text}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
