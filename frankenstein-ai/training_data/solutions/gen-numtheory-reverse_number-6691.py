# Task: gen-numtheory-reverse_number-6691 | Score: 100% | 2026-02-15T12:30:08.475230

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))