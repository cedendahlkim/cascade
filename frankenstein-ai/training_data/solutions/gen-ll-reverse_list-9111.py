# Task: gen-ll-reverse_list-9111 | Score: 100% | 2026-02-15T09:50:58.065972

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))