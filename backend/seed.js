const db = require('./db');

const PROPERTIES = [
    { title: "Cobertura Duplex Gonzaga", subtitle: "A vista mais exclusiva do bairro", price: "R$ 3.500.000", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80", tags: ["Frente Mar", "Exclusivo"], specs: "4 Suítes • 380m²", bairro: "Gonzaga", tipo: "Cobertura" },
    { title: "Unlimited Ocean Front", subtitle: "Lazer de resort na Ponta da Praia", price: "R$ 2.100.000", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80", tags: ["Oportunidade"], specs: "3 Suítes • 160m²", bairro: "Ponta da Praia", tipo: "Apartamento" },
    { title: "Mansão Suspensa", subtitle: "Privacidade total no Morro Sta. Teresinha", price: "R$ 5.800.000", image: "https://images.unsplash.com/photo-1600596542815-22519fec27e6?auto=format&fit=crop&w=1000&q=80", tags: ["Off-Market"], specs: "5 Suítes • 600m²", bairro: "Morro Sta. Teresinha", tipo: "Casa" },
    { title: "Garden Boqueirão", subtitle: "Sensação de casa, segurança de prédio", price: "R$ 1.250.000", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80", tags: ["Quadra da Praia"], specs: "3 Dorms • 140m²", bairro: "Boqueirão", tipo: "Garden" },
    { title: "Vila Rica Concept", subtitle: "Arquitetura moderna no coração do bairro", price: "R$ 1.900.000", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80", tags: ["Lançamento"], specs: "4 Dorms • 210m²", bairro: "Boqueirão", tipo: "Apartamento" },
    { title: "Penthouse Embaré", subtitle: "Vista 360º da orla", price: "R$ 4.200.000", image: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1000&q=80", tags: ["Vista Mar"], specs: "3 Suítes • 240m²", bairro: "Embaré", tipo: "Cobertura" },
    { title: "Casa Neo-Clássica", subtitle: "Reformada na Vila Belmiro", price: "R$ 1.450.000", image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1000&q=80", tags: ["Oportunidade"], specs: "3 Dorms • 180m²", bairro: "Vila Belmiro", tipo: "Casa" },
    { title: "Studio Premium Gonzaga", subtitle: "Rentabilidade garantida para investidor", price: "R$ 480.000", image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80", tags: ["Investimento"], specs: "1 Suíte • 45m²", bairro: "Gonzaga", tipo: "Studio" }
];

function seed() {
    console.log('🌱 Seeding database...');

    // Limpar tabela existente (opcional, Grug prefere limpar pra não duplicar em testes)
    db.prepare('DELETE FROM properties').run();

    const insert = db.prepare(`
    INSERT INTO properties (title, subtitle, price, image, bairro, tipo, specs, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    let count = 0;
    for (const prop of PROPERTIES) {
        insert.run(
            prop.title,
            prop.subtitle,
            prop.price,
            prop.image,
            prop.bairro,
            prop.tipo,
            prop.specs,
            JSON.stringify(prop.tags)
        );
        count++;
    }

    console.log(`✅ Seeded ${count} properties!`);
}

seed();
