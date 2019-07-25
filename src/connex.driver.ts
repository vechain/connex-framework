/** Connex driver interface */
declare namespace Connex {
    interface Driver {
        readonly genesis: Thor.Block
        readonly initialHead: Thor.Status['head']

        // rejected only when driver closed
        getHead(): Promise<Thor.Status['head']>

        getBlock(revision: string | number): Promise<Thor.Block | null>
        getTransaction(id: string, head: string): Promise<Thor.Transaction | null>
        getReceipt(id: string, head: string): Promise<Thor.Receipt | null>

        getAccount(addr: string, revision: string): Promise<Thor.Account>
        getCode(addr: string, revision: string): Promise<Thor.Code>
        getStorage(addr: string, key: string, revision: string): Promise<Thor.Storage>
        explain(
            arg: {
                clauses: Array<{
                    to: string | null
                    value: string
                    data: string
                }>,
                caller?: string
                gas?: number
                gasPrice?: string
            },
            revision: string,
            cacheTies?: string[]
        ): Promise<Thor.VMOutput[]>

        filterEventLogs(
            arg: {
                range: Thor.Filter.Range
                options: {
                    offset: number,
                    limit: number
                }
                criteriaSet: Thor.Event.Criteria[]
                order: 'asc' | 'desc'
            }
        ): Promise<Thor.Event[]>

        filterTransferLogs(
            arg: {
                range: Thor.Filter.Range,
                options: {
                    offset: number,
                    limit: number
                }
                criteriaSet: Thor.Transfer.Criteria[],
                order: 'asc' | 'desc'
            }
        ): Promise<Thor.Transfer[]>

        signTx(
            msg: Array<{
                to: string | null
                value: string
                data: string
                comment?: string
            }>,
            options: {
                signer?: string,
                gas?: number,
                dependsOn?: string,
                link?: string,
                comment?: string
                delegateHandler?: Vendor.SigningService.DelegationHandler
            }
        ): Promise<Vendor.SigningService.TxResponse>

        signCert(
            msg: Vendor.SigningService.CertMessage,
            options: {
                signer?: string
                link?: string
            }
        ): Promise<Vendor.SigningService.CertResponse>

        isAddressOwned(addr: string): boolean
    }
}
