# Task: gen-numtheory-reverse_number-8221 | Score: 100% | 2026-02-13T15:28:06.398675

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))