# Task: gen-numtheory-reverse_number-9378 | Score: 100% | 2026-02-13T13:42:55.786566

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))