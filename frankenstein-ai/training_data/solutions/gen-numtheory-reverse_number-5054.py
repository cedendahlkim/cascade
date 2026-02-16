# Task: gen-numtheory-reverse_number-5054 | Score: 100% | 2026-02-14T12:13:42.047988

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))