# Task: gen-numtheory-reverse_number-7744 | Score: 100% | 2026-02-15T07:52:55.863126

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))