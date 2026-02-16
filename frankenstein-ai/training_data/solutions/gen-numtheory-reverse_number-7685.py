# Task: gen-numtheory-reverse_number-7685 | Score: 100% | 2026-02-13T13:42:56.748762

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))