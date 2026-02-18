# Task: gen-numtheory-reverse_number-5166 | Score: 100% | 2026-02-17T20:12:48.004794

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))