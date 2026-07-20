import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '998901234567' },
    update: {
      role: Role.ADMIN,
      fullName: 'Admin User',
      passwordHash: adminPassword,
      isActive: true,
    },
    create: {
      phoneNumber: '998901234567',
      fullName: 'Admin User',
      role: Role.ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
  });
  console.log(`Admin user: ${admin.fullName} (998901234567 / admin123)`);

  // Create proctor user
  const proctor = await prisma.user.upsert({
    where: { phoneNumber: '998901234568' },
    update: {
      role: Role.PROCTOR,
      fullName: 'Proctor User',
      isActive: true,
    },
    create: {
      phoneNumber: '998901234568',
      fullName: 'Proctor User',
      role: Role.PROCTOR,
      isActive: true,
    },
  });
  console.log(`Proctor user: ${proctor.fullName} (+998901234568)`);

  // Create a student user
  const student = await prisma.user.upsert({
    where: { phoneNumber: '998901234569' },
    update: {
      role: Role.STUDENT,
      fullName: 'Student User',
      isActive: true,
    },
    create: {
      phoneNumber: '998901234569',
      fullName: 'Student User',
      role: Role.STUDENT,
      schoolName: 'School #1',
      grade: 9,
      region: 'Tashkent',
      district: 'Yunusabad',
      isActive: true,
    },
  });
  console.log(`Student user: ${student.fullName} (+998901234569)`);

  // ── Regions and Districts ──────────────────────────────────────────────
  const regionData = [
    { id: 'region-toshkent-shahar', name: 'Toshkent shahar', nameUz: 'Toshkent shahar', nameRu: 'город Ташкент', order: 1, districts: [
      { id: 'district-toshkent-shahar-1', name: 'Bektemir tumani', nameUz: 'Bektemir tumani', nameRu: 'Бектемирский район' },
      { id: 'district-toshkent-shahar-2', name: 'Chilonzor tumani', nameUz: 'Chilonzor tumani', nameRu: 'Чиланзарский район' },
      { id: 'district-toshkent-shahar-3', name: 'Mirobod tumani', nameUz: 'Mirobod tumani', nameRu: 'Мирабадский район' },
      { id: 'district-toshkent-shahar-4', name: 'Mirzo Ulug\'bek tumani', nameUz: 'Mirzo Ulug\'bek tumani', nameRu: 'Мирзо-Улугбекский район' },
      { id: 'district-toshkent-shahar-5', name: 'Olmazor tumani', nameUz: 'Olmazor tumani', nameRu: 'Алмазарский район' },
      { id: 'district-toshkent-shahar-6', name: 'Sergeli tumani', nameUz: 'Sergeli tumani', nameRu: 'Сергелийский район' },
      { id: 'district-toshkent-shahar-7', name: 'Shayxontohir tumani', nameUz: 'Shayxontohir tumani', nameRu: 'Шайхантахурский район' },
      { id: 'district-toshkent-shahar-8', name: 'Uchtepa tumani', nameUz: 'Uchtepa tumani', nameRu: 'Учтепинский район' },
      { id: 'district-toshkent-shahar-9', name: 'Yashnobod tumani', nameUz: 'Yashnobod tumani', nameRu: 'Яшнабадский район' },
      { id: 'district-toshkent-shahar-10', name: 'Yunusobod tumani', nameUz: 'Yunusobod tumani', nameRu: 'Юнусабадский район' },
    ]},
    { id: 'region-toshkent-viloyati', name: 'Toshkent viloyati', nameUz: 'Toshkent viloyati', nameRu: 'Ташкентская область', order: 2, districts: [
      { id: 'district-toshkent-viloyati-1', name: 'Oqqo\'rg\'on tumani', nameUz: 'Oqqo\'rg\'on tumani', nameRu: 'Аккурганский район' },
      { id: 'district-toshkent-viloyati-2', name: 'Ohangaron tumani', nameUz: 'Ohangaron tumani', nameRu: 'Ахангаранский район' },
      { id: 'district-toshkent-viloyati-3', name: 'Bo\'ka tumani', nameUz: 'Bo\'ka tumani', nameRu: 'Букинский район' },
      { id: 'district-toshkent-viloyati-4', name: 'Bo\'stonliq tumani', nameUz: 'Bo\'stonliq tumani', nameRu: 'Бостанлыкский район' },
      { id: 'district-toshkent-viloyati-5', name: 'Chinoz tumani', nameUz: 'Chinoz tumani', nameRu: 'Чиназский район' },
      { id: 'district-toshkent-viloyati-6', name: 'Parkent tumani', nameUz: 'Parkent tumani', nameRu: 'Паркентский район' },
      { id: 'district-toshkent-viloyati-7', name: 'Piskent tumani', nameUz: 'Piskent tumani', nameRu: 'Пскентский район' },
      { id: 'district-toshkent-viloyati-8', name: 'O\'rta Chirchiq tumani', nameUz: 'O\'rta Chirchiq tumani', nameRu: 'Уртачирчикский район' },
      { id: 'district-toshkent-viloyati-9', name: 'Quyi Chirchiq tumani', nameUz: 'Quyi Chirchiq tumani', nameRu: 'Куйичирчикский район' },
      { id: 'district-toshkent-viloyati-10', name: 'Toshkent tumani', nameUz: 'Toshkent tumani', nameRu: 'Ташкентский район' },
    ]},
    { id: 'region-andijon', name: 'Andijon viloyati', nameUz: 'Andijon viloyati', nameRu: 'Андижанская область', order: 3, districts: [
      { id: 'district-andijon-1', name: 'Andijon shahar', nameUz: 'Andijon shahar', nameRu: 'город Андижан' },
      { id: 'district-andijon-2', name: 'Andijon tumani', nameUz: 'Andijon tumani', nameRu: 'Андижанский район' },
      { id: 'district-andijon-3', name: 'Asaka tumani', nameUz: 'Asaka tumani', nameRu: 'Асакинский район' },
      { id: 'district-andijon-4', name: 'Baliqchi tumani', nameUz: 'Baliqchi tumani', nameRu: 'Балыкчинский район' },
      { id: 'district-andijon-5', name: 'Bo\'z tumani', nameUz: 'Bo\'z tumani', nameRu: 'Бузский район' },
      { id: 'district-andijon-6', name: 'Izboskan tumani', nameUz: 'Izboskan tumani', nameRu: 'Избасканский район' },
      { id: 'district-andijon-7', name: 'Jalolquduq tumani', nameUz: 'Jalolquduq tumani', nameRu: 'Джалалкудукский район' },
      { id: 'district-andijon-8', name: 'Marhamat tumani', nameUz: 'Marhamat tumani', nameRu: 'Мархаматский район' },
      { id: 'district-andijon-9', name: 'Oltinko\'l tumani', nameUz: 'Oltinko\'l tumani', nameRu: 'Алтынкульский район' },
      { id: 'district-andijon-10', name: 'Xo\'jaobod tumani', nameUz: 'Xo\'jaobod tumani', nameRu: 'Ходжаабадский район' },
    ]},
    { id: 'region-buxoro', name: 'Buxoro viloyati', nameUz: 'Buxoro viloyati', nameRu: 'Бухарская область', order: 4, districts: [
      { id: 'district-buxoro-1', name: 'Buxoro shahar', nameUz: 'Buxoro shahar', nameRu: 'город Бухара' },
      { id: 'district-buxoro-2', name: 'Buxoro tumani', nameUz: 'Buxoro tumani', nameRu: 'Бухарский район' },
      { id: 'district-buxoro-3', name: 'G\'ijduvon tumani', nameUz: 'G\'ijduvon tumani', nameRu: 'Гиждуванский район' },
      { id: 'district-buxoro-4', name: 'Jondor tumani', nameUz: 'Jondor tumani', nameRu: 'Жандарский район' },
      { id: 'district-buxoro-5', name: 'Kogon tumani', nameUz: 'Kogon tumani', nameRu: 'Каганский район' },
      { id: 'district-buxoro-6', name: 'Olot tumani', nameUz: 'Olot tumani', nameRu: 'Алатский район' },
      { id: 'district-buxoro-7', name: 'Peshku tumani', nameUz: 'Peshku tumani', nameRu: 'Пешкунский район' },
      { id: 'district-buxoro-8', name: 'Qorako\'l tumani', nameUz: 'Qorako\'l tumani', nameRu: 'Каракульский район' },
      { id: 'district-buxoro-9', name: 'Shofirkon tumani', nameUz: 'Shofirkon tumani', nameRu: 'Шафирканский район' },
      { id: 'district-buxoro-10', name: 'Vobkent tumani', nameUz: 'Vobkent tumani', nameRu: 'Вабкентский район' },
    ]},
    { id: 'region-fargona', name: 'Farg\'ona viloyati', nameUz: 'Farg\'ona viloyati', nameRu: 'Ферганская область', order: 5, districts: [
      { id: 'district-fargona-1', name: 'Farg\'ona shahar', nameUz: 'Farg\'ona shahar', nameRu: 'город Фергана' },
      { id: 'district-fargona-2', name: 'Beshariq tumani', nameUz: 'Beshariq tumani', nameRu: 'Бешарыкский район' },
      { id: 'district-fargona-3', name: 'Bog\'dod tumani', nameUz: 'Bog\'dod tumani', nameRu: 'Багдадский район' },
      { id: 'district-fargona-4', name: 'Buvayda tumani', nameUz: 'Buvayda tumani', nameRu: 'Бувайдинский район' },
      { id: 'district-fargona-5', name: 'Dang\'ara tumani', nameUz: 'Dang\'ara tumani', nameRu: 'Дангаринский район' },
      { id: 'district-fargona-6', name: 'Farg\'ona tumani', nameUz: 'Farg\'ona tumani', nameRu: 'Ферганский район' },
      { id: 'district-fargona-7', name: 'Oltiariq tumani', nameUz: 'Oltiariq tumani', nameRu: 'Алтыарыкский район' },
      { id: 'district-fargona-8', name: 'Quva tumani', nameUz: 'Quva tumani', nameRu: 'Кувинский район' },
      { id: 'district-fargona-9', name: 'Rishton tumani', nameUz: 'Rishton tumani', nameRu: 'Риштанский район' },
      { id: 'district-fargona-10', name: 'So\'x tumani', nameUz: 'So\'x tumani', nameRu: 'Сохский район' },
    ]},
    { id: 'region-jizzax', name: 'Jizzax viloyati', nameUz: 'Jizzax viloyati', nameRu: 'Джизакская область', order: 6, districts: [
      { id: 'district-jizzax-1', name: 'Jizzax shahar', nameUz: 'Jizzax shahar', nameRu: 'город Джизак' },
      { id: 'district-jizzax-2', name: 'Arnasoy tumani', nameUz: 'Arnasoy tumani', nameRu: 'Арнасайский район' },
      { id: 'district-jizzax-3', name: 'Baxmal tumani', nameUz: 'Baxmal tumani', nameRu: 'Бахмальский район' },
      { id: 'district-jizzax-4', name: 'Do\'stlik tumani', nameUz: 'Do\'stlik tumani', nameRu: 'Дустликский район' },
      { id: 'district-jizzax-5', name: 'Mirzacho\'l tumani', nameUz: 'Mirzacho\'l tumani', nameRu: 'Мирзачульский район' },
      { id: 'district-jizzax-6', name: 'Paxtakor tumani', nameUz: 'Paxtakor tumani', nameRu: 'Пахтакорский район' },
      { id: 'district-jizzax-7', name: 'Sharof Rashidov tumani', nameUz: 'Sharof Rashidov tumani', nameRu: 'Шароф-Рашидовский район' },
      { id: 'district-jizzax-8', name: 'Zafarobod tumani', nameUz: 'Zafarobod tumani', nameRu: 'Зафарабадский район' },
      { id: 'district-jizzax-9', name: 'Zomin tumani', nameUz: 'Zomin tumani', nameRu: 'Зааминский район' },
    ]},
    { id: 'region-namangan', name: 'Namangan viloyati', nameUz: 'Namangan viloyati', nameRu: 'Наманганская область', order: 7, districts: [
      { id: 'district-namangan-1', name: 'Namangan shahar', nameUz: 'Namangan shahar', nameRu: 'город Наманган' },
      { id: 'district-namangan-2', name: 'Chortoq tumani', nameUz: 'Chortoq tumani', nameRu: 'Чартакский район' },
      { id: 'district-namangan-3', name: 'Chust tumani', nameUz: 'Chust tumani', nameRu: 'Чустский район' },
      { id: 'district-namangan-4', name: 'Kosonsoy tumani', nameUz: 'Kosonsoy tumani', nameRu: 'Кассансайский район' },
      { id: 'district-namangan-5', name: 'Mingbuloq tumani', nameUz: 'Mingbuloq tumani', nameRu: 'Мингбулакский район' },
      { id: 'district-namangan-6', name: 'Namangan tumani', nameUz: 'Namangan tumani', nameRu: 'Наманганский район' },
      { id: 'district-namangan-7', name: 'Norin tumani', nameUz: 'Norin tumani', nameRu: 'Нарынский район' },
      { id: 'district-namangan-8', name: 'Pop tumani', nameUz: 'Pop tumani', nameRu: 'Папский район' },
      { id: 'district-namangan-9', name: 'To\'raqo\'rg\'on tumani', nameUz: 'To\'raqo\'rg\'on tumani', nameRu: 'Туракурганский район' },
      { id: 'district-namangan-10', name: 'Uychi tumani', nameUz: 'Uychi tumani', nameRu: 'Уйчинский район' },
    ]},
    { id: 'region-navoiy', name: 'Navoiy viloyati', nameUz: 'Navoiy viloyati', nameRu: 'Навоийская область', order: 8, districts: [
      { id: 'district-navoiy-1', name: 'Navoiy shahar', nameUz: 'Navoiy shahar', nameRu: 'город Навои' },
      { id: 'district-navoiy-2', name: 'G\'ozg\'on shaharcha', nameUz: 'G\'ozg\'on shaharcha', nameRu: 'г.п. Газган' },
      { id: 'district-navoiy-3', name: 'Konimex tumani', nameUz: 'Konimex tumani', nameRu: 'Канимехский район' },
      { id: 'district-navoiy-4', name: 'Karmana tumani', nameUz: 'Karmana tumani', nameRu: 'Карманинский район' },
      { id: 'district-navoiy-5', name: 'Nurota tumani', nameUz: 'Nurota tumani', nameRu: 'Нуратинский район' },
      { id: 'district-navoiy-6', name: 'Qiziltepa tumani', nameUz: 'Qiziltepa tumani', nameRu: 'Кызылтепинский район' },
      { id: 'district-navoiy-7', name: 'Tomdi tumani', nameUz: 'Tomdi tumani', nameRu: 'Тамдынский район' },
      { id: 'district-navoiy-8', name: 'Uchquduq tumani', nameUz: 'Uchquduq tumani', nameRu: 'Учкудукский район' },
      { id: 'district-navoiy-9', name: 'Xatirchi tumani', nameUz: 'Xatirchi tumani', nameRu: 'Хатырчинский район' },
      { id: 'district-navoiy-10', name: 'Navbahor tumani', nameUz: 'Navbahor tumani', nameRu: 'Навбахорский район' },
    ]},
    { id: 'region-qashqadaryo', name: 'Qashqadaryo viloyati', nameUz: 'Qashqadaryo viloyati', nameRu: 'Кашкадарьинская область', order: 9, districts: [
      { id: 'district-qashqadaryo-1', name: 'Qarshi shahar', nameUz: 'Qarshi shahar', nameRu: 'город Карши' },
      { id: 'district-qashqadaryo-2', name: 'Shahrisabz shahar', nameUz: 'Shahrisabz shahar', nameRu: 'город Шахрисабз' },
      { id: 'district-qashqadaryo-3', name: 'Chiroqchi tumani', nameUz: 'Chiroqchi tumani', nameRu: 'Чиракчинский район' },
      { id: 'district-qashqadaryo-4', name: 'Dehqonobod tumani', nameUz: 'Dehqonobod tumani', nameRu: 'Дехканабадский район' },
      { id: 'district-qashqadaryo-5', name: 'Kasbi tumani', nameUz: 'Kasbi tumani', nameRu: 'Касбийский район' },
      { id: 'district-qashqadaryo-6', name: 'Kitob tumani', nameUz: 'Kitob tumani', nameRu: 'Китабский район' },
      { id: 'district-qashqadaryo-7', name: 'Mirishkor tumani', nameUz: 'Mirishkor tumani', nameRu: 'Миришкорский район' },
      { id: 'district-qashqadaryo-8', name: 'Muborak tumani', nameUz: 'Muborak tumani', nameRu: 'Мубарекский район' },
      { id: 'district-qashqadaryo-9', name: 'Qarshi tumani', nameUz: 'Qarshi tumani', nameRu: 'Каршинский район' },
      { id: 'district-qashqadaryo-10', name: 'Yakkabog\' tumani', nameUz: 'Yakkabog\' tumani', nameRu: 'Яккабагский район' },
    ]},
    { id: 'region-qoraqalpogiston', name: 'Qoraqalpog\'iston Respublikasi', nameUz: 'Qoraqalpog\'iston Respublikasi', nameRu: 'Республика Каракалпакстан', order: 10, districts: [
      { id: 'district-qoraqalpogiston-1', name: 'Nukus shahar', nameUz: 'Nukus shahar', nameRu: 'город Нукус' },
      { id: 'district-qoraqalpogiston-2', name: 'Amudaryo tumani', nameUz: 'Amudaryo tumani', nameRu: 'Амударьинский район' },
      { id: 'district-qoraqalpogiston-3', name: 'Beruniy tumani', nameUz: 'Beruniy tumani', nameRu: 'Берунийский район' },
      { id: 'district-qoraqalpogiston-4', name: 'Bo\'zatov tumani', nameUz: 'Bo\'zatov tumani', nameRu: 'Бозатауский район' },
      { id: 'district-qoraqalpogiston-5', name: 'Ellikqal\'a tumani', nameUz: 'Ellikqal\'a tumani', nameRu: 'Элликкалинский район' },
      { id: 'district-qoraqalpogiston-6', name: 'Kegeyli tumani', nameUz: 'Kegeyli tumani', nameRu: 'Кегейлийский район' },
      { id: 'district-qoraqalpogiston-7', name: 'Mo\'ynoq tumani', nameUz: 'Mo\'ynoq tumani', nameRu: 'Муйнакский район' },
      { id: 'district-qoraqalpogiston-8', name: 'Qonliko\'l tumani', nameUz: 'Qonliko\'l tumani', nameRu: 'Канлыкульский район' },
      { id: 'district-qoraqalpogiston-9', name: 'Taxtako\'pir tumani', nameUz: 'Taxtako\'pir tumani', nameRu: 'Тахтакупырский район' },
      { id: 'district-qoraqalpogiston-10', name: 'Xo\'jayli tumani', nameUz: 'Xo\'jayli tumani', nameRu: 'Ходжейлийский район' },
    ]},
    { id: 'region-samarqand', name: 'Samarqand viloyati', nameUz: 'Samarqand viloyati', nameRu: 'Самаркандская область', order: 11, districts: [
      { id: 'district-samarqand-1', name: 'Samarqand shahar', nameUz: 'Samarqand shahar', nameRu: 'город Самарканд' },
      { id: 'district-samarqand-2', name: 'Bulung\'ur tumani', nameUz: 'Bulung\'ur tumani', nameRu: 'Булунгурский район' },
      { id: 'district-samarqand-3', name: 'Ishtixon tumani', nameUz: 'Ishtixon tumani', nameRu: 'Иштыханский район' },
      { id: 'district-samarqand-4', name: 'Jomboy tumani', nameUz: 'Jomboy tumani', nameRu: 'Джамбайский район' },
      { id: 'district-samarqand-5', name: 'Kattaqo\'rg\'on tumani', nameUz: 'Kattaqo\'rg\'on tumani', nameRu: 'Каттакурганский район' },
      { id: 'district-samarqand-6', name: 'Narpay tumani', nameUz: 'Narpay tumani', nameRu: 'Нарпайский район' },
      { id: 'district-samarqand-7', name: 'Nurobod tumani', nameUz: 'Nurobod tumani', nameRu: 'Нурабадский район' },
      { id: 'district-samarqand-8', name: 'Oqdaryo tumani', nameUz: 'Oqdaryo tumani', nameRu: 'Акдарьинский район' },
      { id: 'district-samarqand-9', name: 'Paxtakor tumani', nameUz: 'Paxtakor tumani', nameRu: 'Пайарыкский район' },
      { id: 'district-samarqand-10', name: 'Toyloq tumani', nameUz: 'Toyloq tumani', nameRu: 'Тайлакский район' },
      { id: 'district-samarqand-11', name: 'Urgut tumani', nameUz: 'Urgut tumani', nameRu: 'Ургутский район' },
    ]},
    { id: 'region-sirdaryo', name: 'Sirdaryo viloyati', nameUz: 'Sirdaryo viloyati', nameRu: 'Сырдарьинская область', order: 12, districts: [
      { id: 'district-sirdaryo-1', name: 'Guliston shahar', nameUz: 'Guliston shahar', nameRu: 'город Гулистан' },
      { id: 'district-sirdaryo-2', name: 'Boyovut tumani', nameUz: 'Boyovut tumani', nameRu: 'Баяутский район' },
      { id: 'district-sirdaryo-3', name: 'Guliston tumani', nameUz: 'Guliston tumani', nameRu: 'Гулистанский район' },
      { id: 'district-sirdaryo-4', name: 'Mirzaobod tumani', nameUz: 'Mirzaobod tumani', nameRu: 'Мирзаабадский район' },
      { id: 'district-sirdaryo-5', name: 'Oqoltin tumani', nameUz: 'Oqoltin tumani', nameRu: 'Акалтынский район' },
      { id: 'district-sirdaryo-6', name: 'Sardoba tumani', nameUz: 'Sardoba tumani', nameRu: 'Сардобинский район' },
      { id: 'district-sirdaryo-7', name: 'Sayxunobod tumani', nameUz: 'Sayxunobod tumani', nameRu: 'Сайхунабадский район' },
      { id: 'district-sirdaryo-8', name: 'Sirdaryo tumani', nameUz: 'Sirdaryo tumani', nameRu: 'Сырдарьинский район' },
      { id: 'district-sirdaryo-9', name: 'Xovos tumani', nameUz: 'Xovos tumani', nameRu: 'Хавастский район' },
    ]},
    { id: 'region-surxondaryo', name: 'Surxondaryo viloyati', nameUz: 'Surxondaryo viloyati', nameRu: 'Сурхандарьинская область', order: 13, districts: [
      { id: 'district-surxondaryo-1', name: 'Termiz shahar', nameUz: 'Termiz shahar', nameRu: 'город Термез' },
      { id: 'district-surxondaryo-2', name: 'Angor tumani', nameUz: 'Angor tumani', nameRu: 'Ангорский район' },
      { id: 'district-surxondaryo-3', name: 'Boysun tumani', nameUz: 'Boysun tumani', nameRu: 'Байсунский район' },
      { id: 'district-surxondaryo-4', name: 'Denov tumani', nameUz: 'Denov tumani', nameRu: 'Денауский район' },
      { id: 'district-surxondaryo-5', name: 'Jarqo\'rg\'on tumani', nameUz: 'Jarqo\'rg\'on tumani', nameRu: 'Джаркурганский район' },
      { id: 'district-surxondaryo-6', name: 'Muzrabot tumani', nameUz: 'Muzrabot tumani', nameRu: 'Музрабадский район' },
      { id: 'district-surxondaryo-7', name: 'Oltinsoy tumani', nameUz: 'Oltinsoy tumani', nameRu: 'Алтынсайский район' },
      { id: 'district-surxondaryo-8', name: 'Qiziriq tumani', nameUz: 'Qiziriq tumani', nameRu: 'Кизирикский район' },
      { id: 'district-surxondaryo-9', name: 'Sho\'rchi tumani', nameUz: 'Sho\'rchi tumani', nameRu: 'Шурчинский район' },
      { id: 'district-surxondaryo-10', name: 'Uzun tumani', nameUz: 'Uzun tumani', nameRu: 'Узунский район' },
    ]},
    { id: 'region-xorazm', name: 'Xorazm viloyati', nameUz: 'Xorazm viloyati', nameRu: 'Хорезмская область', order: 14, districts: [
      { id: 'district-xorazm-1', name: 'Urganch shahar', nameUz: 'Urganch shahar', nameRu: 'город Ургенч' },
      { id: 'district-xorazm-2', name: 'Bog\'ot tumani', nameUz: 'Bog\'ot tumani', nameRu: 'Багатский район' },
      { id: 'district-xorazm-3', name: 'Gurlan tumani', nameUz: 'Gurlan tumani', nameRu: 'Гурленский район' },
      { id: 'district-xorazm-4', name: 'Qo\'shko\'pir tumani', nameUz: 'Qo\'shko\'pir tumani', nameRu: 'Кошкупырский район' },
      { id: 'district-xorazm-5', name: 'Shovot tumani', nameUz: 'Shovot tumani', nameRu: 'Шаватский район' },
      { id: 'district-xorazm-6', name: 'Tuproqqal\'a tumani', nameUz: 'Tuproqqal\'a tumani', nameRu: 'Тупраккалинский район' },
      { id: 'district-xorazm-7', name: 'Urganch tumani', nameUz: 'Urganch tumani', nameRu: 'Ургенчский район' },
      { id: 'district-xorazm-8', name: 'Xiva tumani', nameUz: 'Xiva tumani', nameRu: 'Хивинский район' },
      { id: 'district-xorazm-9', name: 'Yangiariq tumani', nameUz: 'Yangiariq tumani', nameRu: 'Янгиарыкский район' },
      { id: 'district-xorazm-10', name: 'Yangibozor tumani', nameUz: 'Yangibozor tumani', nameRu: 'Янгибазарский район' },
    ]},
  ];

  for (const reg of regionData) {
    const { districts, ...regionFields } = reg;
    const region = await prisma.region.upsert({
      where: { id: regionFields.id },
      update: {},
      create: regionFields,
    });
    for (const dist of districts) {
      await prisma.district.upsert({
        where: { regionId_name: { regionId: region.id, name: dist.name } },
        update: {},
        create: { ...dist, regionId: region.id },
      });
    }
  }
  console.log(`Regions seeded: ${regionData.length}`);

  // Create a location
  const location = await prisma.location.upsert({
    where: { id: 'seed-location-1' },
    update: {},
    create: {
      id: 'seed-location-1',
      name: 'Toshkent Shahar 1-son Maktab',
      address: 'Toshkent shahri, Yunusobod tumani, Amir Temur ko\'chasi 100',
      contactPhone: '+998901234570',
      contactPerson: 'Maktab direktori',
      isActive: true,
    },
  });
  console.log(`Location: ${location.name}`);

  // Create rooms
  const rooms: any[] = [];
  for (let floor = 1; floor <= 3; floor++) {
    for (let roomNum = 1; roomNum <= 5; roomNum++) {
      const room = await prisma.room.upsert({
        where: {
          locationId_roomNumber: {
            locationId: location.id,
            roomNumber: `${floor}0${roomNum}`,
          },
        },
        update: {},
        create: {
          locationId: location.id,
          roomNumber: `${floor}0${roomNum}`,
          capacity: 30,
          floor,
          description: `${floor}-qavat, ${roomNum}-xona`,
          isActive: true,
        },
      });
      rooms.push(room);
    }
  }
  console.log(`Rooms created: ${rooms.length}`);

  // Create olympiads
  const olympiads = [
    { title: 'Matematika Olimpiadasi 2026', subject: 'Matematika', price: 50000 },
    { title: 'Fizika Olimpiadasi 2026', subject: 'Fizika', price: 50000 },
    { title: 'Ingliz Tili Olimpiadasi 2026', subject: 'Ingliz tili', price: 40000 },
    { title: 'Kimyo Olimpiadasi 2026', subject: 'Kimyo', price: 45000 },
    { title: 'Informatika Olimpiadasi 2026', subject: 'Informatika', price: 55000 },
  ];

  for (const olym of olympiads) {
    const olympiad = await prisma.olympiad.upsert({
      where: { id: `seed-olympiad-${olym.subject.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-olympiad-${olym.subject.toLowerCase()}`,
        title: olym.title,
        subject: olym.subject,
        description: `${olym.subject} fanidan maktab o'quvchilari uchun olimpiada`,
        price: olym.price,
        examDate: new Date('2026-09-15T10:00:00Z'),
        regEndDate: new Date('2026-09-10T23:59:59Z'),
        isActive: true,
        maxCapacity: 450,
        createdById: admin.id,
      },
    });

    // Link olympiad to location
    await prisma.olympiadLocation.upsert({
      where: {
        olympiadId_locationId: {
          olympiadId: olympiad.id,
          locationId: location.id,
        },
      },
      update: {},
      create: {
        olympiadId: olympiad.id,
        locationId: location.id,
        isActive: true,
      },
    });

    console.log(`Olympiad: ${olympiad.title}`);
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
