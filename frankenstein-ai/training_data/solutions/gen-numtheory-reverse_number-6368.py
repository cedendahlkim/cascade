# Task: gen-numtheory-reverse_number-6368 | Score: 100% | 2026-02-13T20:50:16.167612

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))