# Task: gen-ll-reverse_list-8153 | Score: 100% | 2026-02-15T13:30:58.334712

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))