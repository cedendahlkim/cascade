# Task: gen-numtheory-reverse_number-7150 | Score: 100% | 2026-02-13T14:18:58.738683

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))