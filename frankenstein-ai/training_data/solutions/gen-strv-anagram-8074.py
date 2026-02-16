# Task: gen-strv-anagram-8074 | Score: 100% | 2026-02-15T10:28:59.775426

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')