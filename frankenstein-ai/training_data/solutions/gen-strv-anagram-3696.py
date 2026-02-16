# Task: gen-strv-anagram-3696 | Score: 100% | 2026-02-13T12:13:19.553989

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')