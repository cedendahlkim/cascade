# Task: gen-ll-reverse_list-5599 | Score: 100% | 2026-02-15T13:59:54.040552

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))