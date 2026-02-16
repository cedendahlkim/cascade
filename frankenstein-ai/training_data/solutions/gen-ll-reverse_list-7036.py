# Task: gen-ll-reverse_list-7036 | Score: 100% | 2026-02-15T10:50:23.971781

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))