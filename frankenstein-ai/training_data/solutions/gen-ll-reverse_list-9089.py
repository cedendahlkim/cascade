# Task: gen-ll-reverse_list-9089 | Score: 100% | 2026-02-15T12:30:30.761159

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))