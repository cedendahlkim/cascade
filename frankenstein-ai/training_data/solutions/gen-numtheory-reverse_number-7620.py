# Task: gen-numtheory-reverse_number-7620 | Score: 100% | 2026-02-13T14:42:34.702606

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))