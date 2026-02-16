# Task: gen-numtheory-reverse_number-2741 | Score: 100% | 2026-02-13T14:01:17.630683

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))