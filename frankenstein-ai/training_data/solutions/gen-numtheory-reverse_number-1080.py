# Task: gen-numtheory-reverse_number-1080 | Score: 100% | 2026-02-13T11:03:11.183370

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))