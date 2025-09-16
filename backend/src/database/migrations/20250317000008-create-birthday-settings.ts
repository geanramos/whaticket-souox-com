// src/database/migrations/20250123002-create-birthday-settings.ts
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('BirthdaySettings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userBirthdayEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Habilitar notificações de aniversário de usuários'
      },
      contactBirthdayEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Habilitar envio automático de mensagens de aniversário para contatos'
      },
      userBirthdayMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '🎉 Parabéns, {nome}! Hoje é seu dia especial! Desejamos muito sucesso e felicidade! 🎂',
        comment: 'Mensagem de aniversário para usuários (interno)'
      },
      contactBirthdayMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '🎉 Parabéns, {nome}! Hoje é seu aniversário! Desejamos muito sucesso, saúde e felicidade! 🎂✨',
        comment: 'Mensagem de aniversário para contatos (WhatsApp)'
      },
      sendBirthdayTime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '09:00:00',
        comment: 'Horário para envio das mensagens de aniversário'
      },
      createAnnouncementForUsers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Criar informativo quando usuário faz aniversário'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Índices
    await queryInterface.addIndex('BirthdaySettings', ['companyId'], {
      unique: true,
      name: 'idx_birthday_settings_company_id'
    });

    // Inserir configurações padrão para todas as empresas existentes
    await queryInterface.sequelize.query(`
      INSERT INTO "BirthdaySettings" ("companyId", "userBirthdayEnabled", "contactBirthdayEnabled", "userBirthdayMessage", "contactBirthdayMessage", "sendBirthdayTime", "createAnnouncementForUsers", "createdAt", "updatedAt")
      SELECT 
        id as "companyId",
        true as "userBirthdayEnabled",
        true as "contactBirthdayEnabled",
        '🎉 Parabéns, {nome}! Hoje é seu dia especial! Desejamos muito sucesso e felicidade! 🎂' as "userBirthdayMessage",
        '🎉 Parabéns, {nome}! Hoje é seu aniversário! Desejamos muito sucesso, saúde e felicidade! 🎂✨' as "contactBirthdayMessage",
        '09:00:00' as "sendBirthdayTime",
        true as "createAnnouncementForUsers",
        NOW() as "createdAt",
        NOW() as "updatedAt"
      FROM "Companies"
      WHERE NOT EXISTS (
        SELECT 1 FROM "BirthdaySettings" WHERE "companyId" = "Companies".id
      )
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('BirthdaySettings');
  }
};