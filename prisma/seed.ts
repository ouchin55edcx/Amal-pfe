import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSpecialites() {
  const specialites = [
    { nom: 'Cardiologie' },
    { nom: 'Pédiatrie' },
    { nom: 'Neurologie' },
    { nom: 'ORL' },
    { nom: 'Dermatologie' },
    { nom: 'Dentisterie' },
    { nom: 'Ophtalmologie' },
    { nom: 'Gynécologie' },
    { nom: 'Psychologie' },
    { nom: 'Médecine générale' },
  ];

  console.log('Seeding specialites...');

  for (const specialite of specialites) {
    await prisma.specialite.create({
      data: specialite,
    });
  }

  console.log('Specialites seeded successfully!');
}

async function seedVilles() {
  const villes = [
    { nom: 'Casablanca', region: 'Casablanca-Settat' },
    { nom: 'Rabat', region: 'Rabat-Salé-Kénitra' },
    { nom: 'Marrakech', region: 'Marrakech-Safi' },
    { nom: 'Fès', region: 'Fès-Meknès' },
    { nom: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma' },
  ];

  console.log('Seeding villes...');

  for (const ville of villes) {
    await prisma.ville.create({
      data: ville,
    });
  }

  console.log('Villes seeded successfully!');
}

async function seedMedecins() {
  console.log('Seeding medecins...');

  const specialites = await prisma.specialite.findMany();
  const villes = await prisma.ville.findMany();

  if (specialites.length === 0 || villes.length === 0) {
    console.error('Please seed specialites and villes first!');
    return;
  }

  // Construire la liste des medecins avec assurance que specialiteId et villeId sont définis
  const medecins = [
    {
      nom: 'Dr. Ahmed Ali',
      adresse: '123 Avenue Hassan II',
      specialiteId: specialites.find((s) => s.nom === 'Cardiologie')?.id,
      villeId: villes.find((v) => v.nom === 'Casablanca')?.id,
    },
    {
      nom: 'Dr. Karim Bennani',
      adresse: '45 Rue Mohammed V',
      specialiteId: specialites.find((s) => s.nom === 'Pédiatrie')?.id,
      villeId: villes.find((v) => v.nom === 'Rabat')?.id,
    },
    {
      nom: 'Dr. Fatima Zahra',
      adresse: '78 Avenue Allal Ben Abdellah',
      specialiteId: specialites.find((s) => s.nom === 'Neurologie')?.id,
      villeId: villes.find((v) => v.nom === 'Marrakech')?.id,
    },
    {
      nom: 'Dr. Amine Saidi',
      adresse: '12 Boulevard Zerktouni',
      specialiteId: specialites.find((s) => s.nom === 'ORL')?.id,
      villeId: villes.find((v) => v.nom === 'Fès')?.id,
    },
    {
      nom: 'Dr. Leila El Mansouri',
      adresse: '56 Rue Ibn Batouta',
      specialiteId: specialites.find((s) => s.nom === 'Dermatologie')?.id,
      villeId: villes.find((v) => v.nom === 'Tanger')?.id,
    },
    {
      nom: 'Dr. Youssef Hachimi',
      adresse: '34 Avenue Mohammed VI',
      specialiteId: specialites.find((s) => s.nom === 'Dentisterie')?.id,
      villeId: villes.find((v) => v.nom === 'Casablanca')?.id,
    },
    {
      nom: 'Dr. Nadia Boussaid',
      adresse: '90 Rue Abou Bakr Seddik',
      specialiteId: specialites.find((s) => s.nom === 'Ophtalmologie')?.id,
      villeId: villes.find((v) => v.nom === 'Rabat')?.id,
    },
    {
      nom: 'Dr. Mehdi Touzani',
      adresse: '23 Boulevard Anfa',
      specialiteId: specialites.find((s) => s.nom === 'Gynécologie')?.id,
      villeId: villes.find((v) => v.nom === 'Marrakech')?.id,
    },
    {
      nom: 'Dr. Hajar Idrissi',
      adresse: '67 Avenue Hassan II',
      specialiteId: specialites.find((s) => s.nom === 'Psychologie')?.id,
      villeId: villes.find((v) => v.nom === 'Fès')?.id,
    },
    {
      nom: 'Dr. Mohamed Fadili',
      adresse: '45 Rue Ibn Sina',
      specialiteId: specialites.find((s) => s.nom === 'Médecine générale')?.id,
      villeId: villes.find((v) => v.nom === 'Tanger')?.id,
    },
  ];

  // Valider que tous les medecins ont bien specialiteId et villeId définis
  for (const medecin of medecins) {
    if (!medecin.specialiteId || !medecin.villeId) {
      throw new Error(
        `Missing specialiteId or villeId for medecin ${medecin.nom}`
      );
    }
  }

  // Création des 3 medecins spécifiques avec ID fixe
  const specificDoctors = medecins.slice(0, 3).map((medecin, index) => ({
    id: [
      'clvnqnxzx0000uc0ggxvnfzqj',
      'clvnqnxzx0001uc0g3jd7a9xk',
      'clvnqnxzx0002uc0gqvb5fzqj',
    ][index],
    nom: medecin.nom,
    adresse: medecin.adresse,
    specialiteId: medecin.specialiteId!,
    villeId: medecin.villeId!,
  }));

  for (const doctor of specificDoctors) {
    // Vérifier si le médecin existe déjà
    const existingDoctor = await prisma.listeMedecins.findUnique({
      where: { id: doctor.id },
    });

    if (!existingDoctor) {
      await prisma.listeMedecins.create({
        data: doctor,
      });
    } else {
      await prisma.listeMedecins.update({
        where: { id: doctor.id },
        data: {
          nom: doctor.nom,
          adresse: doctor.adresse,
          specialiteId: doctor.specialiteId,
          villeId: doctor.villeId,
        },
      });
    }
  }

  // Création des autres medecins
  for (let i = 3; i < medecins.length; i++) {
    const medecin = medecins[i];
    await prisma.listeMedecins.create({
      data: {
        nom: medecin.nom,
        adresse: medecin.adresse,
        specialiteId: medecin.specialiteId!,
        villeId: medecin.villeId!,
      },
    });
  }

  console.log('Medecins seeded successfully!');
}

async function main() {
  console.log('Starting seeding process...');

  // Nettoyage des données existantes dans l'ordre correct
  await prisma.listeMedecins.deleteMany();
  await prisma.specialite.deleteMany();
  await prisma.ville.deleteMany();

  // Seed spécialités, villes, puis médecins
  await seedSpecialites();
  await seedVilles();
  await seedMedecins();

  console.log('All seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
