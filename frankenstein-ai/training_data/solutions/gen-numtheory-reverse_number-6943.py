# Task: gen-numtheory-reverse_number-6943 | Score: 100% | 2026-02-15T09:34:50.903132

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))