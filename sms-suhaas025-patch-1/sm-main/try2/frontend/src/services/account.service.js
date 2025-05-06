import api from './api.service';

class AccountService {
    /**
     * Get account status for the current user
     * @returns {Promise<Object>} The account status
     */
    getMyAccountStatus() {
        return api.get('/account-management/status/me')
            .then(response => {
                console.log('Account status response:', response.data);
                return response.data;
            });
    }

    /**
     * Get account status for a specific user (admin only)
     * @param {number} userId The user ID
     * @returns {Promise<Object>} The account status
     */
    getUserAccountStatus(userId) {
        return api.get(`/account-management/status/${userId}`)
            .then(response => {
                console.log('User account status response:', response.data);
                return response.data;
            });
    }

    /**
     * Block a user account (admin only)
     * @param {number} userId The user ID
     * @returns {Promise<Object>} Success message
     */
    blockUser(userId) {
        return api.post(`/account-management/block/${userId}`)
            .then(response => {
                console.log('Block user response:', response.data);
                return response.data;
            });
    }

    /**
     * Unblock a user account (admin only)
     * @param {number} userId The user ID
     * @returns {Promise<Object>} Success message
     */
    unblockUser(userId) {
        return api.post(`/account-management/unblock/${userId}`)
            .then(response => {
                console.log('Unblock user response:', response.data);
                return response.data;
            });
    }

    /**
     * Extend account expiration date (admin only)
     * @param {number} userId The user ID
     * @param {number} days Number of days to extend
     * @returns {Promise<Object>} Success message
     */
    extendExpiration(userId, days) {
        return api.post(`/account-management/extend-expiration/${userId}?days=${days}`)
            .then(response => {
                console.log('Extend expiration response:', response.data);
                return response.data;
            });
    }

    /**
     * Reduce account expiration date (admin only)
     * @param {number} userId The user ID
     * @param {number} days Number of days to reduce
     * @returns {Promise<Object>} Success message
     */
    reduceExpiration(userId, days) {
        return api.post(`/account-management/reduce-expiration/${userId}?days=${days}`)
            .then(response => {
                console.log('Reduce expiration response:', response.data);
                return response.data;
            });
    }

    /**
     * Force expire a user account (admin only)
     * @param {number} userId The user ID
     * @returns {Promise<Object>} Success message
     */
    expireAccount(userId) {
        return api.post(`/account-management/expire/${userId}`)
            .then(response => {
                console.log('Expire account response:', response.data);
                return response.data;
            });
    }

    /**
     * Get account status for all users (admin only)
     * @returns {Promise<Array>} List of account status
     */
    getAllAccountsStatus() {
        return api.get('/admin/accounts/status')
            .then(response => {
                console.log('All accounts status response:', response.data);
                return response.data;
            });
    }

    /**
     * Get account status summary (admin only)
     * @returns {Promise<Object>} Account status summary
     */
    getAccountStatusSummary() {
        return api.get('/admin/accounts/status/summary')
            .then(response => {
                console.log('Account status summary response:', response.data);
                return response.data;
            });
    }
}

export default new AccountService(); 