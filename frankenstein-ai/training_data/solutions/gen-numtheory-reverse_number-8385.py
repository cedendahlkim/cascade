# Task: gen-numtheory-reverse_number-8385 | Score: 100% | 2026-02-13T16:06:56.028115

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))