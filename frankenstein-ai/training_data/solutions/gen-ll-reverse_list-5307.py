# Task: gen-ll-reverse_list-5307 | Score: 100% | 2026-02-15T13:59:38.532125

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))