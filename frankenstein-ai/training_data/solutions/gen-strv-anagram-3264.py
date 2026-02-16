# Task: gen-strv-anagram-3264 | Score: 100% | 2026-02-14T12:02:34.203353

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')