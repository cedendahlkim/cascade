# Task: gen-numtheory-reverse_number-3493 | Score: 100% | 2026-02-13T14:01:34.161019

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))