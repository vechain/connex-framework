
declare namespace Connex {
    interface Driver {
        readonly genesis: Thor.Block
        readonly head: Thor.Status['head']

        getBlock(revision: string | number): Promise<Thor.Block | null>
        getTransaction(id: string, head: string): Promise<Thor.Transaction | null>
        getReceipt(id: string, head: string): Promise<Thor.Receipt | null>

        getAccount(addr: string, revision: string): Promise<Thor.Account>
        getCode(addr: string, revision: string): Promise<Thor.Code>
        getStorage(addr: string, key: string, revision: string): Promise<Thor.Storage>
        explain(
            arg: {
                clauses: Thor.Clause[],
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
            msg: Vendor.SigningService.TxMessage,
            options: {
                delegated?: boolean,
                signer?: string,
                gas?: number,
                dependsOn?: string,
                link?: string,
                comment?: string
            }
        ): Promise<{
            unsignedTx?: {
                raw: string,
                origin: string
            },
            doSign(delegatorSignature?: string): Promise<Vendor.SigningService.TxResponse>
        }>

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
