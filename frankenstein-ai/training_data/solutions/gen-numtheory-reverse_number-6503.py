# Task: gen-numtheory-reverse_number-6503 | Score: 100% | 2026-02-17T20:11:58.635561

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))