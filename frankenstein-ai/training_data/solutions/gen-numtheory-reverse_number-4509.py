# Task: gen-numtheory-reverse_number-4509 | Score: 100% | 2026-02-17T20:35:42.386261

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))