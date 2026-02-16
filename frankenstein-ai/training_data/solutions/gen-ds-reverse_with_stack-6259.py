# Task: gen-ds-reverse_with_stack-6259 | Score: 100% | 2026-02-13T10:14:55.359627

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))