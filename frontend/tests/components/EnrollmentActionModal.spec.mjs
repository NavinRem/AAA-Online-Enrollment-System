import { test, expect } from '@playwright/experimental-ct-vue';

test.use({ viewport: { width: 800, height: 800 } });

const mockEnrollment = {
  id: 'enr1',
  student: { name: 'Jimmy' },
  program: { name: 'Math Basics' },
  finalPrice: 150,
  status: 'Pending',
  class: {
    name: 'Class A',
    branch: { name: 'Main Branch', abbr: 'MB' },
    schedule: [{ day: 1, startTime: '09:00', endTime: '10:00' }]
  }
};

import EnrollmentActionModal from '../../src/components/enrollments/EnrollmentActionModal.vue';

test('renders correctly for Pay action', async ({ mount, page }) => {
  await mount(EnrollmentActionModal, {
    props: {
      isOpen: true,
      type: 'pay',
      enrollment: mockEnrollment
    }
  });
  await expect(page.locator('.z-modal h3')).toContainText('Pay Enrollment');

  // Contains summary text
  await expect(page.locator('.z-modal')).toContainText('Jimmy');
  await expect(page.locator('.z-modal')).toContainText('Math Basics');
  await expect(page.locator('.z-modal')).toContainText('$150');

  // Verify online channel requires Bank and Proof
  await page.locator('button:has-text("Online / Bank")').click();
  const submitBtn = page.locator('button', { hasText: 'Pay' }).first();
  await submitBtn.click(); // Should trigger validation
  
  // Validation should show up
  await expect(page.locator('.z-modal')).toContainText('is required');
});

test('renders correctly for Cancel action', async ({ mount, page }) => {
  await mount(EnrollmentActionModal, {
    props: {
      isOpen: true,
      type: 'cancel',
      enrollment: mockEnrollment
    }
  });

  await expect(page.locator('.z-modal h3')).toContainText('Cancel Enrollment');
  
  const submitBtn = page.locator('button', { hasText: 'Cancel' }).last(); // The red submit button
  await submitBtn.click(); 
  
  // Should trigger validation for reason
  await expect(page.locator('.z-modal')).toContainText('is required');

  // Click a preset
  await page.locator('button:has-text("Financial Issue")').click();
  // Reason should populate, validation should clear if we submit
  await submitBtn.click();
  
  // Confirmation overlay should appear
  await expect(page.locator('text=Confirm Cancellation')).toBeVisible();
});

test('renders correctly for Delete action', async ({ mount, page }) => {
  await mount(EnrollmentActionModal, {
    props: {
      isOpen: true,
      type: 'delete',
      enrollment: mockEnrollment
    }
  });

  await expect(page.locator('.z-modal h3')).toContainText('Delete Enrollment');
  
  const submitBtn = page.locator('button', { hasText: 'Delete' }).last(); 
  
  // Fill wrong confirmation
  const input = page.locator('input[placeholder=\'Type "DELETE" to confirm\']');
  await input.fill('DEL');
  await submitBtn.click();

  await expect(page.locator('text=Type DELETE to confirm')).toBeVisible();

  // Fill right confirmation
  await input.fill('DELETE');
  await submitBtn.click();

  // Confirmation overlay should appear
  await expect(page.locator('.z-modal')).toContainText('Confirm Deletion');
});
