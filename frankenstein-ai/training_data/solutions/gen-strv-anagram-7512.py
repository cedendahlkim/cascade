# Task: gen-strv-anagram-7512 | Score: 100% | 2026-02-15T08:47:26.975449

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')