import { Signer } from "..";
import { SignatureConfig, SIG_CONFIG } from "../../constants";
import Arweave from "arweave";
import base64url from "base64url";

export default class InjectedWebauthSigner implements Signer {
  private signer: any;
  public publicKey: Buffer;
  readonly ownerLength: number = SIG_CONFIG[SignatureConfig.WEBAUTH].pubLength;
  readonly signatureLength: number =
    SIG_CONFIG[SignatureConfig.WEBAUTH].sigLength;
  readonly signatureType: SignatureConfig = SignatureConfig.WEBAUTH;

  // 传递 Everpay 实例，以及 publicKey
  constructor({ everpay, publicKey, account, debug }: any) {
    const sign = {
      everpay,
      account,
      debug,
      getActivePublicKey: function (): any {
        return publicKey;
      },
    };
    this.signer = sign;
  }

  // 设置 PublicKey
  async setPublicKey(): Promise<void> {
    // try {
    //   await checkArPermissions(this.signer, ["ACCESS_PUBLIC_KEY"])
    // } catch {
    //   throw new Error("ACCESS_PUBLIC_KEY_PERMISSION_NEEDED")
    // }
    const fidoOwner = await this.signer.getActivePublicKey();
    this.publicKey = base64url.toBuffer(fidoOwner);
  }

  // 签名数据
  async sign(message: Uint8Array): Promise<Uint8Array> {
    console.log(message, "message");
    if (!this.publicKey) {
      await this.setPublicKey();
    }
    console.log(123123123);
    try {
      const { sig } = await this.signer.everpay.signMessageAsync(
        { isSmartAccount: true, debug: this.signer.debug, account: this.signer.account },
        encodeURIComponent(message.toString()),
      );
      console.log(sig, "sig");
      // message.set(sig)
      return Buffer.from(message);
    } catch {
      throw new Error("SIGNATURE_FAILED");
    }

    // try {
    //   await checkArPermissions(this.signer, "SIGNATURE")
    // } catch {
    //   throw new Error("SIGNATURE_PERMISSION_NEEDED")
    // }

    // const algorithm = {
    //   name: "RSA-PSS",
    //   saltLength: 0
    // }

    // try {
    //   const signature = await this.signer.signature(
    //     message,
    //     algorithm
    //   )
    //   const buf = new Uint8Array(Object.values(signature))
    //   return buf
    // } catch {
    //   throw new Error("SIGNATURE_FAILED")
    // }
  }

  static async verify(
    pk: string,
    message: Uint8Array,
    signature: Uint8Array,
  ): Promise<boolean> {
    return await Arweave.crypto.verify(pk, message, signature);
  }
}
