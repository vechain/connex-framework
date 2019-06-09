
export interface Driver {
    pullHead(): Promise<Connex.Thor.Status['head']>

    getBlock(rev: string | number): Promise<Connex.Thor.Block | null>
    getTransaction(id: string, head: string): Promise<Connex.Thor.Transaction | null>
    getReceipt(id: string, head: string): Promise<Connex.Thor.Receipt | null>

    getAccount(addr: string, rev: string): Promise<Connex.Thor.Account>
    getCode(addr: string, rev: string): Promise<Connex.Thor.Code>
    getStorage(addr: string, key: string, rev: string): Promise<Connex.Thor.Storage>

    filterEventLogs(
        arg: {
            range: Connex.Thor.Filter.Range
            options: {
                offset: number,
                limit: number
            }
            criteriaSet: Connex.Thor.Event.Criteria[]
            order: 'asc' | 'desc'
        }
    ): Promise<Connex.Thor.Event[]>

    filterTransferLogs(
        arg: {
            range: Connex.Thor.Filter.Range,
            options: {
                offset: number,
                limit: number
            }
            criteriaSet: Connex.Thor.Transfer.Criteria[],
            order: 'asc' | 'desc'
        }
    ): Promise<Connex.Thor.Transfer[]>

    explain(
        arg: {
            clauses: Connex.Thor.Clause[],
            caller?: string
            gas?: number
            gasPrice?: string
        },
        rev: string,
        cacheTies?: string[]
    ): Promise<Connex.Thor.VMOutput[]>

    pullOwnedAddresses(): Promise<string[]>
    buildTx(
        msg: Connex.Vendor.SigningService.TxMessage,
        options: {
            delegated?: boolean,
            signer?: string,
            gas?: number,
            dependsOn?: string,
            link?: string,
            comment?: string
        }
    ): Promise<{
        unsignedTx: {
            raw: string,
            origin: string
        },
        sign(delegatorSignature?: string): Promise<Connex.Vendor.SigningService.TxResponse>
    }>

    signCert(
        msg: Connex.Vendor.SigningService.CertMessage,
        options: {
            signer?: string
            link?: string
        }
    ): Promise<Connex.Vendor.SigningService.CertResponse>
}
