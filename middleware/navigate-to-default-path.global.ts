export default defineNuxtRouteMiddleware((to, from) => {
    if (to.fullPath === '/network-reports') {
        return navigateTo('/network-reports/votes');
    } else if (to.fullPath === '/master-data') {
        return navigateTo('/master-data/countries');
    } else if (to.fullPath === '/website-data') {
        return navigateTo('/website-data/pages');
    } else if (to.fullPath === '/members-data') {
        return navigateTo('/members-data/members');
    } else if (to.fullPath === '/conferences') {
        return navigateTo('/conferences/overview');
    } else if (to.fullPath === '/conferences-data') {
        return navigateTo('/conferences-data/header-menu');
    } else if (to.fullPath === '/conferences-attendees') {
        return navigateTo('/conferences-attendees/registered-members');
    } else if (to.fullPath === '/conferences-reports') {
        return navigateTo('/conferences-reports/one-to-one-report');
    } else if (to.fullPath === '/conferences-settings') {
        return navigateTo('/conferences-settings/update-settings');
    } else if (to.fullPath === '/admins-area') {
        return navigateTo('/admins-area/admins');
    } else if (to.fullPath === '/conferences-page') {
        return navigateTo('/conferences-page/home');
    }
});
