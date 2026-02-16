# Task: gen-numtheory-reverse_number-7169 | Score: 100% | 2026-02-15T10:09:47.434445

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))