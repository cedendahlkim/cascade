# Task: gen-numtheory-reverse_number-3370 | Score: 100% | 2026-02-13T19:35:42.471615

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))