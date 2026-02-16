# Task: gen-ll-reverse_list-7049 | Score: 100% | 2026-02-13T14:00:41.042807

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))