# Task: gen-numtheory-reverse_number-1003 | Score: 100% | 2026-02-17T20:11:54.298417

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))