# Task: gen-ds-reverse_with_stack-8232 | Score: 100% | 2026-02-13T14:19:12.405541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))