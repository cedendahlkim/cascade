# Task: gen-numtheory-reverse_number-1109 | Score: 100% | 2026-02-13T18:58:10.569939

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))