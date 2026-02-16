# Task: gen-ll-reverse_list-4466 | Score: 100% | 2026-02-15T10:29:04.294088

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))