# Task: gen-ll-reverse_list-2027 | Score: 100% | 2026-02-15T13:59:53.744939

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))